import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Pointage from '@/models/Pointage';
import Conge from '@/models/Conge';
import User from '@/models/User';
import Notification from '@/models/Notification';

// Ce endpoint est appelé par un CRON job deux fois par jour (heures UTC) :
// 11:00 UTC (= 12:00 Casablanca) → /api/anomalies/detecter?periode=matin
// 17:00 UTC (= 18:00 Casablanca) → /api/anomalies/detecter?periode=apres-midi
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
      return Response.json(
        { error: "Paramètre 'periode' invalide. Utilisez '?periode=matin' ou '?periode=apres-midi'." },
        { status: 400 }
      );
    }

    // Date du jour normalisée à minuit UTC
    // (identique à la normalisation dans POST /api/pointage)
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Récupérer tous les employés actifs ET approuvés
    const activeEmployees = await User.find({
      role: 'EMPLOYE',
      actif: true,
      approuve: true,
    });

    let anomaliesCreated = 0;

    for (const emp of activeEmployees) {
      // Vérifier si l'employé a un congé valide pour cette journée
      const activeLeave = await Conge.findOne({
        employe: emp._id,
        statut: 'VALIDE',
        date_debut: { $lte: todayEnd },
        date_fin: { $gte: todayStart },
      });

      if (activeLeave) {
        continue; // L'employé est en congé validé, pas d'anomalie
      }

      // ═══════════════════════════════════════════════════════════════
      // CORRECTION CRITIQUE : on filtre par date EXACTE (todayStart)
      // car le champ 'date' de chaque pointage est normalisé à minuit.
      // L'ancien code filtrait par plage horaire [12h, 18h] sur le
      // champ 'date', ce qui ne matchait JAMAIS (date = 00:00:00).
      // ═══════════════════════════════════════════════════════════════
      const pointagesToday = await Pointage.find({
        employe: emp._id,
        date: todayStart, // match exact : toutes les dates sont à 00:00:00 UTC
      }).sort({ createdAt: 1 });

      // Fonction utilitaire pour créer une anomalie + notifications
      const createAnomalyWithNotif = async (type, titre, description) => {
        try {
          await Anomalie.create({
            employe: emp._id,
            date: todayStart,
            type: type,
            description: description,
            heuresTravaillees: 0,
            seuilAttendu: 4, // 4 heures par demi-journée
            resolu: false,
            commentaireAdmin: 'Absence détectée automatiquement par le système à la fin de la période.',
          });

          // Notification Employé
          await Notification.create({
            employe: emp._id,
            titre: `⚠️ Avertissement : ${titre}`,
            message: 'Système : ' + description,
            type: 'AVERTISSEMENT',
          });

          // Notification Admin
          await Notification.create({
            employe: null,
            titre: `❌ ${titre} — ${emp.nom}`,
            message: `${emp.nom} (${emp.matricule}) — ${description}`,
            type: 'ALERTE',
          });

          anomaliesCreated++;
        } catch (e) {
          // E11000 = doublon, l'anomalie existe déjà (grâce à l'index unique)
          if (e.code !== 11000) {
            console.error(`Erreur lors de la création de l'anomalie pour ${emp.nom}:`, e);
          }
        }
      };

      // ═══════════════════════════════════════════════════════════
      // LOGIQUE DE DÉTECTION SELON LA PÉRIODE
      // ═══════════════════════════════════════════════════════════

      if (periode === 'matin') {
        // ─── CRON MATIN (12:00 Casablanca) ───
        // Si aucun pointage du tout → l'employé ne s'est pas présenté
        if (pointagesToday.length === 0) {
          await createAnomalyWithNotif(
            'ABSENCE_MATIN',
            'Absence Matin',
            "Absence injustifiée détectée : aucun pointage d'entrée enregistré avant 12h00."
          );
        }
      } else {
        // ─── CRON APRÈS-MIDI (18:00 Casablanca) ───
        // Analyser l'état de la journée selon le nombre de pointages

        if (pointagesToday.length === 0) {
          // Aucun pointage de toute la journée
          // Filet de sécurité : si le CRON matin a échoué, on crée ABSENCE_MATIN
          // (sera ignoré silencieusement si déjà créé, grâce à l'index unique)
          await createAnomalyWithNotif(
            'ABSENCE_MATIN',
            'Absence Matin',
            "Absence injustifiée détectée : aucun pointage enregistré de toute la journée."
          );
        } else if (pointagesToday.length === 1) {
          // 1 seul pointage = ENTRÉE sans aucune sortie de toute la journée
          await createAnomalyWithNotif(
            'INCOHERENCE_JOURNEE',
            'Incohérence Journée',
            "Incohérence : un seul pointage enregistré dans la journée (entrée sans aucune sortie)."
          );
        } else if (pointagesToday.length === 2) {
          // 2 pointages = ENTRÉE + SORTIE déjeuner, mais jamais revenu
          await createAnomalyWithNotif(
            'ABSENCE_APRES_MIDI',
            'Absence Après-midi',
            "Absence l'après-midi : l'employé a quitté pour le déjeuner mais n'est pas revenu (aucun retour détecté avant 18h00)."
          );
        } else if (pointagesToday.length === 3) {
          // 3 pointages = ENTRÉE + SORTIE déjeuner + RETOUR, mais pas de sortie finale
          // L'employé est revenu mais n'a pas enregistré sa sortie à 18h
          await createAnomalyWithNotif(
            'INCOHERENCE_JOURNEE',
            'Incohérence Journée',
            "Incohérence : l'employé est revenu après le déjeuner mais n'a pas enregistré sa sortie de fin de journée."
          );
        }
        // 4 pointages = journée complète et valide, aucune anomalie CRON
      }
    }

    return Response.json(
      {
        message: `Détection des anomalies (${periode}) terminée avec succès.`,
        anomaliesCreated,
        totalEmployesVerifies: activeEmployees.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in CRON detect anomalies:', error);
    return Response.json(
      { error: 'Erreur interne lors du traitement CRON.' },
      { status: 500 }
    );
  }
}
