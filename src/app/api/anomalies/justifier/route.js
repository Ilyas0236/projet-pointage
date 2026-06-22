import dbConnect from '@/lib/db';
import Anomalie from '@/models/Anomalie';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import fs from 'fs';

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

      const uploadDir = join(process.cwd(), 'public', 'uploads', 'justifications');
      // Create dir if not exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const safeFilename = file.name ? file.name.replace(/[^a-zA-Z0-9.-]/g, '_') : 'fichier';
      const filename = `${uniqueSuffix}-${safeFilename}`;
      const path = join(uploadDir, filename);

      await writeFile(path, buffer);
      filePath = `/uploads/justifications/${filename}`;
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
    return Response.json({ error: 'Erreur lors de l\'envoi de la justification' }, { status: 500 });
  }
}
