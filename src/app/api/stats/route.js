import dbConnect from '@/lib/db';
import User from '@/models/User';
import Pointage from '@/models/Pointage';
import Anomalie from '@/models/Anomalie';
import Conge from '@/models/Conge';
import { verifyAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      );
    }

    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setUTCHours(23, 59, 59, 999);

    // 1. General counts
    const totalEmployees = await User.countDocuments({ role: 'EMPLOYE', actif: true });
    const pointagesToday = await Pointage.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
    });
    const pendingConges = await Conge.countDocuments({ statut: 'EN_ATTENTE' });
    const unresolvedAnomalies = await Anomalie.countDocuments({ resolu: false });

    // 2. Anomalies breakdown
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

    // 3. Last 7 days attendance statistics (for charts)
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

      // Count entries and exits
      const entries = await Pointage.countDocuments({
        date: { $gte: start, $lte: end },
        type: 'ENTREE',
      });
      const exits = await Pointage.countDocuments({
        date: { $gte: start, $lte: end },
        type: 'SORTIE',
      });
      const dayAnomalies = await Anomalie.countDocuments({
        date: { $gte: start, $lte: end },
      });

      chartData.push({
        label: `${dayName} ${formattedDate}`,
        entrees: entries,
        sorties: exits,
        anomalies: dayAnomalies,
      });
    }

    return Response.json({
      counts: {
        totalEmployees,
        pointagesToday,
        pendingConges,
        unresolvedAnomalies,
      },
      anomalies: anomalyStats,
      chartData,
    }, { status: 200 });
  } catch (error) {
    console.error('Error in GET stats:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
