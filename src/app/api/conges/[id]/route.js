import dbConnect from '@/lib/db';
import Conge from '@/models/Conge';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { statut } = await req.json();

    if (!statut || !['VALIDE', 'REFUSE'].includes(statut)) {
      return Response.json(
        { error: 'Statut valide requis (VALIDE ou REFUSE)' },
        { status: 400 }
      );
    }

    const conge = await Conge.findById(id);
    if (!conge) {
      return Response.json({ error: 'Demande de congé non trouvée' }, { status: 404 });
    }

    if (conge.statut !== 'EN_ATTENTE') {
      return Response.json(
        { error: 'Cette demande a déjà été traitée ou annulée.' },
        { status: 400 }
      );
    }

    conge.statut = statut;
    conge.traite_par = payload.userId;
    conge.date_traitement = new Date();
    await conge.save();

    // Notify the employee
    await Notification.create({
      employe: conge.employe,
      titre: `Demande de congé ${statut === 'VALIDE' ? 'validée' : 'refusée'}`,
      message: `Votre demande de congé pour la période du ${new Date(
        conge.date_debut
      ).toLocaleDateString('fr-FR')} au ${new Date(conge.date_fin).toLocaleDateString(
        'fr-FR'
      )} a été ${statut === 'VALIDE' ? 'acceptée ✅' : 'refusée ❌'}.`,
      type: 'CONGE',
    });

    return Response.json(
      { message: `Demande de congé mise à jour avec succès (${statut}).`, conge },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT conge by ID API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;

    const conge = await Conge.findById(id);
    if (!conge) {
      return Response.json({ error: 'Demande de congé non trouvée' }, { status: 404 });
    }

    // Employees can only cancel their own conge requests
    if (payload.role !== 'ADMIN' && conge.employe.toString() !== payload.userId) {
      return Response.json(
        { error: 'Vous ne pouvez pas annuler la demande de quelqu\'un d\'autre.' },
        { status: 403 }
      );
    }

    if (conge.statut !== 'EN_ATTENTE') {
      return Response.json(
        { error: 'Seules les demandes en attente peuvent être annulées.' },
        { status: 400 }
      );
    }

    conge.statut = 'ANNULE';
    await conge.save();

    return Response.json(
      { message: 'Demande de congé annulée avec succès.', conge },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE conge API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
