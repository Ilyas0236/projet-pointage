import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Pointage from '@/models/Pointage';
import Conge from '@/models/Conge';
import User from '@/models/User';
import Notification from '@/models/Notification';

// ... (skipping unchanged code for safety by replacing the whole block)

// This endpoint is meant to be called by a CRON job twice a day:
// 12:00 -> /api/anomalies/detecter?periode=matin
// 18:00 -> /api/anomalies/detecter?periode=apres-midi
export async function GET(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('CRON Detection called without proper secret');
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const periode = searchParams.get('periode');

    if (periode !== 'matin' && periode !== 'apres-midi') {
      return Response.json({ error: "Paramètre 'periode' invalide. Utilisez '?periode=matin' ou '?periode=apres-midi'." }, { status: 400 });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Définir la plage horaire à vérifier selon la période
    // Matin : on cherche un pointage entre minuit et midi
    // Après-midi : on cherche un pointage entre midi et 18h
    let checkStart = new Date(todayStart);
    let checkEnd = new Date(todayStart);
    let typeAnomalie = '';
    let titreAnomalie = '';
    
    if (periode === 'matin') {
      checkStart.setUTCHours(0, 0, 0, 0);
      checkEnd.setUTCHours(12, 0, 0, 0);
      typeAnomalie = 'ABSENCE_MATIN';
      titreAnomalie = 'Absence Matin';
    } else {
      checkStart.setUTCHours(12, 0, 0, 0);
      checkEnd.setUTCHours(18, 0, 0, 0);
      typeAnomalie = 'ABSENCE_APRES_MIDI';
      titreAnomalie = 'Absence Après-midi';
    }

    const activeEmployees = await User.find({ role: 'EMPLOYE', actif: true });
    let anomaliesCreated = 0;

    for (const emp of activeEmployees) {
      // Vérifier si l'employé a un congé valide pour cette journée
      const activeLeave = await Conge.findOne({
        employe: emp._id,
        statut: 'VALIDE',
        date_debut: { $lte: todayEnd },
        date_fin: { $gte: todayStart }
      });

      if (activeLeave) {
        continue; // L'employé est en congé validé, on ne crée pas d'anomalie
      }

      // Chercher n'importe quel pointage d'ENTREE dans la plage horaire
      const pointagesPeriode = await Pointage.find({
        employe: emp._id,
        type: 'ENTREE',
        date: { $gte: checkStart, $lte: checkEnd }
      });

      if (pointagesPeriode.length === 0) {
        // Aucun pointage d'entrée détecté dans la plage horaire
        try {
          const desc = `Absence injustifiée détectée pour la période : ${titreAnomalie}. Aucun pointage d'entrée enregistré avant ${periode === 'matin' ? '12h00' : '18h00'}.`;
          
          await Anomalie.create({
            employe: emp._id,
            date: todayStart,
            type: typeAnomalie,
            description: desc,
            heuresTravaillees: 0,
            seuilAttendu: 4, // 4 heures par demi-journée
            resolu: false,
            commentaireAdmin: 'Absence détectée automatiquement par le système à la fin de la période.'
          });
          
          // Notification Employé
          await Notification.create({
            employe: emp._id,
            titre: `⚠️ Avertissement : ${titreAnomalie}`,
            message: 'Système : ' + desc,
            type: 'AVERTISSEMENT',
          });

          // Notification Admin
          await Notification.create({
            employe: null, // null signifie que c'est pour les admins
            titre: `❌ ${titreAnomalie} — ${emp.nom}`,
            message: `${emp.nom} (${emp.matricule}) n'a effectué aucun pointage d'entrée ce ${periode}.`,
            type: 'ALERTE',
          });

          anomaliesCreated++;
        } catch (e) {
          // Si l'erreur est un doublon (E11000), on l'ignore car l'anomalie existe déjà (grâce à l'index unique).
          if (e.code !== 11000) {
            console.error(`Erreur lors de la création de l'anomalie pour ${emp.nom}:`, e);
          }
        }
      }
    }

    return Response.json({
      message: `Détection des anomalies (${periode}) terminée avec succès.`,
      anomaliesCreated
    }, { status: 200 });

  } catch (error) {
    console.error('Error in CRON detect anomalies:', error);
    return Response.json(
      { error: 'Erreur interne lors du traitement CRON.' },
      { status: 500 }
    );
  }
}
