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
      .populate('zone', 'nom')
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

    const { latitude, longitude, qrCode } = await req.json();

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

    // Get latest pointage of the day to determine ENTREE/SORTIE
    const lastPointage = await Pointage.findOne({
      employe: payload.userId,
      date: { $gte: todayStart, $lte: todayEnd },
    }).sort({ createdAt: -1 });

    let pointageType = 'ENTREE';
    if (lastPointage) {
      pointageType = lastPointage.type === 'ENTREE' ? 'SORTIE' : 'ENTREE';
    }

    // Current hour string
    const formatTime = (d) => {
      const hrs = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${hrs}:${mins}`;
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
    });

    // 4. Anomaly checks
    const anomaliesCreated = [];
    const employeeUser = await User.findById(payload.userId).select('nom matricule');
    const employeeName = employeeUser?.nom || 'Employé inconnu';
    const employeeMatricule = employeeUser?.matricule || '';

    if (pointageType === 'ENTREE') {
      // Latency threshold 08:30
      const [hrs, mins] = currentTimeStr.split(':').map(Number);
      const timeVal = hrs * 60 + mins;
      const thresholdVal = 8 * 60 + 30; // 08:30

      if (timeVal > thresholdVal) {
        try {
          const delayMin = timeVal - thresholdVal;
          const description = `Retard de ${delayMin} minutes à l'arrivée (arrivée à ${currentTimeStr}, seuil 08:30)`;
          const anomaly = await Anomalie.create({
            employe: payload.userId,
            date: todayStart,
            type: 'RETARD',
            description,
            heuresTravaillees: 0,
            seuilAttendu: 8,
          });
          anomaliesCreated.push(anomaly);

          // Notification automatique pour l'Admin
          await Notification.create({
            employe: null,
            titre: `⏱️ Retard détecté — ${employeeName}`,
            message: `${employeeName} (${employeeMatricule}) est arrivé(e) à ${currentTimeStr} avec un retard de ${delayMin} minutes.`,
            type: 'ALERTE',
          });
        } catch (e) {
          // If unique index fails, anomaly already exists for today
          console.log('Retard anomaly already exists');
        }
      }
    } else {
      // Exit pointage
      // Find the corresponding ENTREE pointage for today
      const entryPointage = await Pointage.findOne({
        employe: payload.userId,
        date: { $gte: todayStart, $lte: todayEnd },
        type: 'ENTREE',
      }).sort({ createdAt: 1 }); // first entry of the day

      if (entryPointage) {
        const [entryHrs, entryMins] = entryPointage.heure.split(':').map(Number);
        const [exitHrs, exitMins] = currentTimeStr.split(':').map(Number);

        const entryVal = entryHrs * 60 + entryMins;
        const exitVal = exitHrs * 60 + exitMins;

        const minutesWorked = exitVal - entryVal;
        const hoursWorked = Math.round((minutesWorked / 60) * 100) / 100;

        // Check if hours worked < 8
        if (hoursWorked < 8) {
          try {
            const description = `Insuffisance horaire : ${hoursWorked} heures effectuées (minimum requis : 8.00h)`;
            const anomaly = await Anomalie.create({
              employe: payload.userId,
              date: todayStart,
              type: 'INSUFFISANCE_HEURES',
              description,
              heuresTravaillees: hoursWorked,
              seuilAttendu: 8,
            });
            anomaliesCreated.push(anomaly);

            // Notification automatique pour l'Admin
            await Notification.create({
              employe: null,
              titre: `📉 Heures insuffisantes — ${employeeName}`,
              message: `${employeeName} (${employeeMatricule}) a travaillé seulement ${hoursWorked}h sur 8h requises.`,
              type: 'ALERTE',
            });
          } catch (e) {
            console.log('Insuffisance hours anomaly already exists');
          }
        }

        // Check if early exit before 17:00
        const thresholdExitVal = 17 * 60; // 17:00
        if (exitVal < thresholdExitVal) {
          try {
            const description = `Sortie anticipée à ${currentTimeStr} (heure légale de sortie : 17:00)`;
            const anomaly = await Anomalie.create({
              employe: payload.userId,
              date: todayStart,
              type: 'SORTIE_ANTICIPEE',
              description,
              heuresTravaillees: hoursWorked,
              seuilAttendu: 8,
            });
            anomaliesCreated.push(anomaly);

            // Notification automatique pour l'Admin
            await Notification.create({
              employe: null,
              titre: `🏃 Sortie anticipée — ${employeeName}`,
              message: `${employeeName} (${employeeMatricule}) a quitté les locaux à ${currentTimeStr} au lieu de 17:00.`,
              type: 'ALERTE',
            });
          } catch (e) {
            console.log('Early exit anomaly already exists');
          }
        }
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
