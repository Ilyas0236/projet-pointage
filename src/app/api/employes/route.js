import dbConnect from '@/lib/db';
import User from '@/models/User';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();

    // Verify auth and role
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      );
    }

    // List all users with role EMPLOYE, sorting by creation date
    const employees = await User.find({ role: 'EMPLOYE' })
      .select('-password')
      .sort({ createdAt: -1 });

    return Response.json(employees, { status: 200 });
  } catch (error) {
    console.error('Error in listing employees API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
