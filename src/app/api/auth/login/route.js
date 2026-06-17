import dbConnect from '@/lib/db';
import User from '@/models/User';
import { signToken } from '@/lib/auth';
import rateLimit from '@/lib/rateLimit';

const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 500, // Max 500 IPs per interval
});

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown-ip';
    try {
      await limiter.check(5, `login_${ip}`); // Max 5 login attempts per minute per IP
    } catch {
      return Response.json(
        { error: 'Trop de tentatives de connexion. Veuillez patienter une minute.' },
        { status: 429 }
      );
    }

    await dbConnect();
    const { email, password } = await req.json();

    if (!email || !password) {
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // Security practice: do not expose details about user existence
    const errorMessage = 'Email ou mot de passe incorrect';

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.actif) {
      return Response.json({ error: errorMessage }, { status: 401 });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return Response.json({ error: errorMessage }, { status: 401 });
    }

    if (user.approuve === false) {
      return Response.json(
        { error: "Votre compte est en attente de validation par l'administrateur" },
        { status: 403 }
      );
    }

    // Sign JWT
    const token = signToken({ userId: user._id, role: user.role });

    // Set cookie headers
    const cookieString = `token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax`;

    const userData = {
      _id: user._id,
      nom: user.nom,
      email: user.email,
      role: user.role,
      matricule: user.matricule,
      departement: user.departement,
    };

    return new Response(
      JSON.stringify({ token, user: userData }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookieString,
        },
      }
    );
  } catch (error) {
    console.error('Error in login API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
