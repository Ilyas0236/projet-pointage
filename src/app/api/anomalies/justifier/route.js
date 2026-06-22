import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const formData = await req.formData();
    const anomalyId = formData.get('anomalyId');
    const message = formData.get('message');
    const file = formData.get('file');

    if (!anomalyId) {
      return Response.json({ error: 'ID de l\'anomalie requis' }, { status: 400 });
    }

    const anomaly = await Anomalie.findOne({ _id: anomalyId, employe: payload.userId }).populate('employe', 'nom matricule');
    if (!anomaly) {
      return Response.json({ error: 'Anomalie non trouvée ou accès refusé' }, { status: 404 });
    }

    if (anomaly.resolu) {
      return Response.json({ error: 'Cette anomalie est déjà résolue' }, { status: 400 });
    }

    let filePath = anomaly.justificationFichier;

    if (file && file.size > 0) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const mimeType = file.type || 'application/octet-stream';
      
      // Vercel est serverless (lecture seule). On convertit le fichier en Base64 pour le stocker en BDD.
      filePath = `data:${mimeType};base64,${buffer.toString('base64')}`;
    }

    anomaly.justificationMessage = message || '';
    if (filePath) {
      anomaly.justificationFichier = filePath;
    }
    anomaly.statutJustification = 'EN_ATTENTE';
    
    await anomaly.save();

    // Notifier l'Administrateur
    await Notification.create({
      employe: null,
      titre: `📄 Justificatif soumis — ${anomaly.employe.nom}`,
      message: `${anomaly.employe.nom} a soumis une justification pour son anomalie (${anomaly.type}).`,
      type: 'INFO',
    });

    return Response.json({ message: 'Justification envoyée avec succès', anomaly }, { status: 200 });

  } catch (error) {
    console.error('Error in justifier API:', error);
    return Response.json({ error: error.message || 'Erreur lors de l\'envoi de la justification' }, { status: 500 });
  }
}
