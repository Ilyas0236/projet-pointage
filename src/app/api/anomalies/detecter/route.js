import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Pointage from '@/models/Pointage';
import Conge from '@/models/Conge';
import User from '@/models/User';
import Notification from '@/models/Notification';

// ... (skipping unchanged code for safety by replacing the whole block)

// This endpoint is meant to be called by a CRON job (e.g. at 23:59)
export async function POST(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.warn('CRON Detection called without proper secret');
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    const activeEmployees = await User.find({ role: 'EMPLOYE', actif: true });
    let anomaliesCreated = 0;

    for (const emp of activeEmployees) {
      // Check if employee has pointages today
      const pointagesToday = await Pointage.find({
        employe: emp._id,
        date: { $gte: todayStart, $lte: todayEnd }
      });

      if (pointagesToday.length === 0) {
        // Employee didn't clock in. Are they on leave?
        const activeLeave = await Conge.findOne({
          employe: emp._id,
          statut: 'VALIDE',
          date_debut: { $lte: todayEnd },
          date_fin: { $gte: todayStart }
        });

        if (!activeLeave) {
          // Employee is absent without leave!
          try {
            const desc = 'Absence injustifiée (aucun pointage enregistré aujourd\'hui)';
            await Anomalie.create({
              employe: emp._id,
              date: todayStart,
              type: 'ABSENCE',
              description: desc,
              heuresTravaillees: 0,
              seuilAttendu: 8,
              resolu: false,
              commentaireAdmin: 'Absence injustifiée système. Veuillez justifier.' // Auto comment
            });
            
            // Auto warning to Employee
            await Notification.create({
              employe: emp._id,
              titre: '⚠️ Avertissement : Absence',
              message: 'Système : ' + desc,
              type: 'AVERTISSEMENT',
            });

            // Auto alert to Admin
            await Notification.create({
              employe: null,
              titre: `❌ Absence détectée — ${emp.nom}`,
              message: `${emp.nom} (${emp.matricule}) n'a effectué aucun pointage aujourd'hui.`,
              type: 'ALERTE',
            });

            anomaliesCreated++;
          } catch (e) {
            // Might throw if already exists
          }
        }
      } else {
        // If they clocked in, let's verify if they never clocked out (Missing exit)
        // We look for the last pointage of the day
        const lastPointage = pointagesToday.sort((a, b) => b.createdAt - a.createdAt)[0];
        if (lastPointage && lastPointage.type === 'ENTREE') {
          // Pointed IN but never OUT
          try {
            await Anomalie.create({
              employe: emp._id,
              date: todayStart,
              type: 'SORTIE_ANTICIPEE', // Or a custom 'OUBLI_SORTIE' if desired
              description: 'Pointage de sortie manquant pour la journée.',
              heuresTravaillees: 0,
              seuilAttendu: 8,
              resolu: false
            });
            anomaliesCreated++;
          } catch (e) {}
        }
      }
    }

    return Response.json({
      message: 'Détection des anomalies CRON terminée avec succès.',
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
