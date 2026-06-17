import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PUT(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { nom, email, oldPassword, newPassword } = await req.json();

    const user = await User.findById(payload.userId);
    if (!user) {
      return Response.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Update info
    if (nom) user.nom = nom;
    if (email) user.email = email;

    // Update password
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return Response.json({ error: 'L\'ancien mot de passe est incorrect.' }, { status: 400 });
      }
      user.password = newPassword;
    }

    await user.save();

    // Return user without password
    const safeUser = {
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      matricule: user.matricule,
      departement: user.departement
    };

    return Response.json({ message: 'Profil mis à jour avec succès.', user: safeUser }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT profil API:', error);
    return Response.json({ error: 'Une erreur interne est survenue' }, { status: 500 });
  }
}
