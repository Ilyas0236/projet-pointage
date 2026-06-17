import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

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
      const type = searchParams.get('type');
      const resolu = searchParams.get('resolu');

      if (employeId) filter.employe = employeId;
      if (type) filter.type = type;
      if (resolu !== null && resolu !== undefined) {
        filter.resolu = resolu === 'true';
      }
    } else {
      // Employees can only view their own anomalies
      filter.employe = payload.userId;
    }

    const anomalies = await Anomalie.find(filter)
      .populate('employe', 'nom email matricule departement')
      .sort({ date: -1 });

    return Response.json(anomalies, { status: 200 });
  } catch (error) {
    console.error('Error in GET anomalies:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

// Allows updating anomaly status (e.g. resolve it, admin only)
export async function PUT(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const { anomalyId, resolu, commentaireAdmin } = await req.json();

    if (!anomalyId) {
      return Response.json({ error: 'ID de l\'anomalie requis' }, { status: 400 });
    }

    const anomaly = await Anomalie.findById(anomalyId).populate('employe', 'nom');
    if (!anomaly) {
      return Response.json({ error: 'Anomalie non trouvée' }, { status: 404 });
    }

    if (resolu !== undefined) {
      anomaly.resolu = resolu;
    }

    // Si l'Admin écrit un commentaire/avertissement
    if (commentaireAdmin && commentaireAdmin.trim()) {
      anomaly.commentaireAdmin = commentaireAdmin.trim();

      // Envoyer une notification d'avertissement à l'employé
      await Notification.create({
        employe: anomaly.employe._id || anomaly.employe,
        titre: `⚠️ Avertissement de l'administrateur`,
        message: commentaireAdmin.trim(),
        type: 'AVERTISSEMENT',
      });
    }

    await anomaly.save();

    return Response.json({ message: 'Anomalie mise à jour', anomaly }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT anomalies:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
