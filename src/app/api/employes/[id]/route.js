import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await User.findById(id).select('-password');
    if (!user) {
      return Response.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    return Response.json(user, { status: 200 });
  } catch (error) {
    console.error('Error in GET employee by ID API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();

    const user = await User.findById(id);
    if (!user) {
      return Response.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    // Update simple fields
    if (body.nom) user.nom = body.nom;
    if (body.email) user.email = body.email.toLowerCase();
    if (body.matricule) user.matricule = body.matricule;
    if (body.departement) user.departement = body.departement;
    if (body.actif !== undefined) user.actif = body.actif;
    if (body.approuve !== undefined) user.approuve = body.approuve;

    // Handle password update if provided
    if (body.password) {
      user.password = body.password; // pre-save hook will hash it
    }

    await user.save();

    const userData = {
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      matricule: user.matricule,
      departement: user.departement,
      actif: user.actif,
      approuve: user.approuve,
    };

    return Response.json(
      { message: 'Employé mis à jour avec succès', user: userData },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT employee API:', error);
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
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const user = await User.findById(id);
    if (!user) {
      return Response.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    // Soft delete: set actif to false
    user.actif = false;
    await user.save();

    return Response.json(
      { message: 'Employé désactivé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE employee API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
