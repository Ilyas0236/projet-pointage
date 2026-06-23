import dbConnect from '@/lib/db';
import Pointage from '@/models/Pointage';
import QRCode from '@/models/QRCode';
import Anomalie from '@/models/Anomalie';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = {};

    if (payload.role === 'ADMIN') {
      const employeId = searchParams.get('employe');
      const dateStr = searchParams.get('date');

      if (employeId) {
        filter.employe = employeId;
      }
      if (dateStr) {
        const startOfDay = new Date(dateStr);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(dateStr);
        endOfDay.setUTCHours(23, 59, 59, 999);
        filter.date = { $gte: startOfDay, $lte: endOfDay };
      }
    } else {
      // Employees can only see their own history
      filter.employe = payload.userId;
    }

    const pointages = await Pointage.find(filter)
      .populate('employe', 'nom email matricule departement')
      .sort({ createdAt: -1 });

    return Response.json(pointages, { status: 200 });
  } catch (error) {
    console.error('Error in GET pointages:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { latitude, longitude, qrCode, zone_id } = await req.json();

    if (latitude === undefined || longitude === undefined || !qrCode) {
      return Response.json(
        { error: 'Données GPS et scan du QR Code requis.' },
        { status: 400 }
      );
    }

    // 2. QR Code Check
    const activeQR = await QRCode.findOne({
      code: qrCode,
      actif: true,
      dateExpiration: { $gt: new Date() },
    });

    if (!activeQR) {
      return Response.json(
        { error: 'Le QR Code scanné est invalide ou a expiré.' },
        { status: 400 }
      );
    }

    // 3. Determine Entry vs Exit type
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Get absolute latest pointage for anti-spam check
    const absoluteLastPointage = await Pointage.findOne({
      employe: payload.userId,
    }).sort({ createdAt: -1 });

    if (absoluteLastPointage) {
      const timeDiffMs = new Date() - new Date(absoluteLastPointage.createdAt);
      if (timeDiffMs < 60000) { // 60 seconds
        return Response.json(
          { error: 'Veuillez patienter au moins 1 minute entre deux pointages.' },
          { status: 429 }
        );
      }
    }

    // Get ALL pointages of the day for the employee
    const pointagesToday = await Pointage.find({
      employe: payload.userId,
      date: { $gte: todayStart, $lte: todayEnd },
    }).sort({ createdAt: 1 });

    if (pointagesToday.length >= 4) {
      return Response.json(
        { error: 'Quota quotidien atteint (Maximum 4 pointages par jour).' },
        { status: 400 }
      );
    }

    // Determine type: 0 -> ENTREE, 1 -> SORTIE, 2 -> ENTREE, 3 -> SORTIE
    const pointageType = pointagesToday.length % 2 === 0 ? 'ENTREE' : 'SORTIE';

    // Current hour string in local timezone (Africa/Casablanca = UTC+1)
    const formatTime = (d) => {
      return d.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Africa/Casablanca'
      });
    };
    const currentTimeStr = formatTime(now);

    // Save Pointage
    const pointage = await Pointage.create({
      employe: payload.userId,
      date: todayStart,
      heure: currentTimeStr,
      type: pointageType,
      latitude,
      longitude,
      valide: true,
      qrcode: activeQR._id,
      zone: zone_id || undefined,
    });

    // 4. Anomaly checks (Nouvelle Logique Stricte)
    const anomaliesCreated = [];
    const employeeUser = await User.findById(payload.userId).select('nom matricule');
    const employeeName = employeeUser?.nom || 'Employé inconnu';
    const employeeMatricule = employeeUser?.matricule || '';

    // Fonction utilitaire pour créer une anomalie
    const createAnomaly = async (type, description) => {
      try {
        const anomaly = await Anomalie.create({
          employe: payload.userId,
          date: todayStart,
          type: type,
          description: description,
          heuresTravaillees: 0,
          seuilAttendu: 8,
        });
        anomaliesCreated.push(anomaly);

        // Notification automatique pour l'Admin
        await Notification.create({
          employe: null,
          titre: `⚠️ Anomalie : ${type} — ${employeeName}`,
          message: `${employeeName} (${employeeMatricule}) a généré une anomalie à ${currentTimeStr}. Raison : ${description}`,
          type: 'ALERTE',
        });

        // Notification automatique pour l'Employé
        await Notification.create({
          employe: payload.userId,
          titre: `⚠️ Anomalie détectée : ${type}`,
          message: description,
          type: 'AVERTISSEMENT',
        });

      } catch (e) {
        console.log(`Anomaly ${type} already exists for today.`);
      }
    };

    const [hrs, mins] = currentTimeStr.split(':').map(Number);
    const timeVal = hrs * 60 + mins;

    // --- MACHINE À ÉTATS SELON LE POINTAGE ---
    if (pointagesToday.length === 0) {
      // Pointage 1 : ENTRÉE MATIN
      if (timeVal > 12 * 60) {
        await createAnomaly('ABSENCE_MATIN', `Employé absent le matin (aucun pointage entre 08:30 et 12:00). Arrivé à ${currentTimeStr}`);
      } else if (timeVal > 8 * 60 + 30) {
        const delayMin = timeVal - (8 * 60 + 30);
        await createAnomaly('RETARD', `Retard de ${delayMin} minutes à l'arrivée (arrivée à ${currentTimeStr}, seuil 08:30)`);
      }
    } 
    else if (pointagesToday.length === 1) {
      // Pointage 2 : SORTIE DÉJEUNER
      if (timeVal < 12 * 60) {
        await createAnomaly('SORTIE_NON_AUTORISEE', `Sortie non autorisée avant 12:00 (sortie à ${currentTimeStr})`);
      } else if (timeVal > 14 * 60) {
        await createAnomaly('INCOHERENCE_JOURNEE', `Incohérence : pas de sortie déjeuner enregistrée dans les temps (scan à ${currentTimeStr})`);
      }
    } 
    else if (pointagesToday.length === 2) {
      // Pointage 3 : RETOUR DÉJEUNER
      if (timeVal > 14 * 60) {
        await createAnomaly('ABSENCE_APRES_MIDI', `Employé absent l'après-midi (aucun retour avant 14:00). Retour à ${currentTimeStr}`);
      }
    } 
    else if (pointagesToday.length === 3) {
      // Pointage 4 : SORTIE FINALE
      if (timeVal < 18 * 60) {
        await createAnomaly('SORTIE_ANTICIPEE', `Sortie anticipée à ${currentTimeStr} (heure légale de sortie : 18:00)`);
      }
    }

    return Response.json(
      {
        message: `Pointage d'${pointageType === 'ENTREE' ? 'entrée' : 'sortie'} enregistré avec succès.`,
        pointage: {
          _id: pointage._id,
          type: pointage.type,
          heure: pointage.heure,
        },
        anomalies: anomaliesCreated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in clocking API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
