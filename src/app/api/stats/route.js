import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pointage from '@/models/Pointage';
import Anomalie from '@/models/Anomalie';
import Conge from '@/models/Conge';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    if (payload.role === 'ADMIN') {
      // --- ADMIN STATS ---
      const totalEmployees = await User.countDocuments({ role: 'EMPLOYE', actif: true });
      const pointagesToday = await Pointage.countDocuments({
        date: { $gte: todayStart, $lte: todayEnd },
      });
      const pendingConges = await Conge.countDocuments({ statut: 'EN_ATTENTE' });
      const unresolvedAnomalies = await Anomalie.countDocuments({ resolu: false });

      const anomaliesByType = await Anomalie.aggregate([
        { $match: { resolu: false } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]);

      const anomalyStats = {
        RETARD: 0,
        ABSENCE: 0,
        SORTIE_ANTICIPEE: 0,
        INSUFFISANCE_HEURES: 0,
      };
      anomaliesByType.forEach((item) => {
        anomalyStats[item._id] = item.count;
      });

      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const start = new Date(d);
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(d);
        end.setUTCHours(23, 59, 59, 999);

        const dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
        const formattedDate = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

        const entries = await Pointage.countDocuments({ date: { $gte: start, $lte: end }, type: 'ENTREE' });
        const exits = await Pointage.countDocuments({ date: { $gte: start, $lte: end }, type: 'SORTIE' });
        const dayAnomalies = await Anomalie.countDocuments({ date: { $gte: start, $lte: end } });

        chartData.push({ label: `${dayName} ${formattedDate}`, entrees: entries, sorties: exits, anomalies: dayAnomalies });
      }

      return Response.json({
        counts: { totalEmployees, pointagesToday, pendingConges, unresolvedAnomalies },
        anomalies: anomalyStats,
        chartData,
      }, { status: 200 });

    } else {
      // --- EMPLOYE STATS ---
      // 1. Recent Historique
      const historique = await Pointage.find({ employe: payload.userId })
        .sort({ createdAt: -1 })
        .limit(10);

      // 2. Heures ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setUTCHours(0, 0, 0, 0);
      
      const pointagesMois = await Pointage.find({
        employe: payload.userId,
        date: { $gte: startOfMonth }
      }).sort({ createdAt: 1 });

      let heuresCeMois = 0;
      let entriesByDay = {};

      pointagesMois.forEach(p => {
        const d = p.date.toISOString().split('T')[0];
        if (!entriesByDay[d]) entriesByDay[d] = [];
        entriesByDay[d].push(p);
      });

      Object.values(entriesByDay).forEach(dayPointages => {
        let workedMinutes = 0;
        if (dayPointages.length >= 2) {
          const [e1h, e1m] = dayPointages[0].heure.split(':').map(Number);
          const [s1h, s1m] = dayPointages[1].heure.split(':').map(Number);
          workedMinutes += (s1h * 60 + s1m) - (e1h * 60 + e1m);
        }
        if (dayPointages.length >= 4) {
          const [e2h, e2m] = dayPointages[2].heure.split(':').map(Number);
          const [s2h, s2m] = dayPointages[3].heure.split(':').map(Number);
          workedMinutes += (s2h * 60 + s2m) - (e2h * 60 + e2m);
        }
        if (workedMinutes > 0) heuresCeMois += workedMinutes / 60;
      });

      // 3. Presence semaine (Chart Data)
      const presenceSemaine = [];
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      
      // Go back to Monday
      const curr = new Date();
      const first = curr.getDate() - curr.getDay() + 1; 
      
      for (let i = 0; i < 5; i++) { // Mon to Fri
        const d = new Date(curr.setDate(first + i));
        d.setUTCHours(0,0,0,0);
        const dayStr = d.toISOString().split('T')[0];
        const dayName = days[d.getDay()];
        
        const dayPointages = entriesByDay[dayStr] || [];
        let heuresDay = 0;
        let workedMinutes = 0;
        if (dayPointages.length >= 2) {
          const [e1h, e1m] = dayPointages[0].heure.split(':').map(Number);
          const [s1h, s1m] = dayPointages[1].heure.split(':').map(Number);
          workedMinutes += (s1h * 60 + s1m) - (e1h * 60 + e1m);
        }
        if (dayPointages.length >= 4) {
          const [e2h, e2m] = dayPointages[2].heure.split(':').map(Number);
          const [s2h, s2m] = dayPointages[3].heure.split(':').map(Number);
          workedMinutes += (s2h * 60 + s2m) - (e2h * 60 + e2m);
        }
        if (workedMinutes > 0) heuresDay = workedMinutes / 60;

        presenceSemaine.push({
          name: dayName,
          heures: Math.round(heuresDay * 10) / 10
        });
      }

      // 4. Pointages Aujourd'hui et Statut
      const pointagesToday = await Pointage.find({
        employe: payload.userId,
        date: { $gte: todayStart, $lte: todayEnd },
      }).sort({ createdAt: 1 });

      const pointagesAujourdhui = pointagesToday.length;
      const pointagesRestants = Math.max(0, 4 - pointagesAujourdhui);
      
      let statutActuel = 'Absent';
      if (pointagesAujourdhui === 1) statutActuel = 'Présent';
      if (pointagesAujourdhui === 2) statutActuel = 'En pause déjeuner';
      if (pointagesAujourdhui === 3) statutActuel = 'Présent';
      if (pointagesAujourdhui >= 4) statutActuel = 'Journée terminée';

      const dernierPointage = pointagesAujourdhui > 0 ? pointagesToday[pointagesToday.length - 1] : null;

      // 5. Calcul des heures travaillées aujourd'hui (complétées)
      let heuresAujourdhuiMs = 0;
      if (pointagesAujourdhui >= 2) {
        const [e1h, e1m] = pointagesToday[0].heure.split(':').map(Number);
        const [s1h, s1m] = pointagesToday[1].heure.split(':').map(Number);
        heuresAujourdhuiMs += ((s1h * 60 + s1m) - (e1h * 60 + e1m)) * 60000;
      }
      if (pointagesAujourdhui >= 4) {
        const [e2h, e2m] = pointagesToday[2].heure.split(':').map(Number);
        const [s2h, s2m] = pointagesToday[3].heure.split(':').map(Number);
        heuresAujourdhuiMs += ((s2h * 60 + s2m) - (e2h * 60 + e2m)) * 60000;
      }

      return Response.json({
        historique,
        heuresCeMois: Math.round(heuresCeMois),
        presenceSemaine,
        pointagesAujourdhui,
        pointagesRestants,
        statutActuel,
        dernierPointage,
        heuresAujourdhuiMs
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error in GET stats:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
