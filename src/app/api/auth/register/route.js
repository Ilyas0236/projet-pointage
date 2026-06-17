import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 IPs per interval
});

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    try {
      await limiter.check(5, `register_${ip}`); // Max 5 requests per minute per IP
    } catch {
      return Response.json(
        { error: 'Trop de requêtes. Veuillez patienter une minute.' },
        { status: 429 }
      );
    }

    await dbConnect();

    // Verify auth and role
    const payload = await verifyAuth(req);
    const isAdmin = payload && payload.role === 'ADMIN';

    const { nom, email, password, role, matricule, departement } = await req.json();

    if (!nom || !email || !password) {
      return Response.json(
        { error: 'Nom, email et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return Response.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // For employees, check matricule uniqueness
    if (role === 'EMPLOYE' && matricule) {
      const existingMatricule = await User.findOne({ matricule });
      if (existingMatricule) {
        return Response.json(
          { error: 'Ce matricule est déjà attribué' },
          { status: 400 }
        );
      }
    }

    const finalRole = isAdmin ? (role || 'EMPLOYE') : 'EMPLOYE';
    const isApproved = isAdmin;

    // Create User
    const newUser = await User.create({
      nom,
      email,
      password,
      role: finalRole,
      matricule: finalRole === 'ADMIN' ? undefined : matricule,
      departement: finalRole === 'ADMIN' ? undefined : departement,
      actif: true,
      approuve: isApproved,
    });

    const userData = {
      _id: newUser._id,
      nom: newUser.nom,
      email: newUser.email,
      role: newUser.role,
      matricule: newUser.matricule,
      departement: newUser.departement,
    };

    const responseMessage = isApproved 
      ? 'Utilisateur créé avec succès' 
      : "Compte créé avec succès. En attente de validation par l'administrateur.";

    return Response.json(
      { message: responseMessage, user: userData },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in register API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
