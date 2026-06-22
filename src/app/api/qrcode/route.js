import dbConnect from '@/lib/db';
import QRCode from '@/models/QRCode';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Get the latest active QR Code
    const qr = await QRCode.findOne({ actif: true, dateExpiration: { $gt: new Date() } })
      .sort({ createdAt: -1 });

    if (!qr) {
      return Response.json(
        { error: 'Aucun QR Code actif disponible. Contactez l\'administrateur.' },
        { status: 404 }
      );
    }

    return Response.json(qr, { status: 200 });
  } catch (error) {
    console.error('Error in GET QR Code API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload || payload.role !== 'ADMIN') {
      return Response.json(
        { error: 'Accès non autorisé. Réservé aux administrateurs.' },
        { status: 403 }
      );
    }

    // Deactivate all old QR Codes
    await QRCode.updateMany({ actif: true }, { actif: false });

    // Generate new code
    const uniqueToken = crypto.randomUUID();
    
    // Default expiration is 10 minutes from now (for high security pointage)
    const dateExpiration = new Date(Date.now() + 10 * 60 * 1000); 

    const qr = await QRCode.create({
      code: uniqueToken,
      dateGeneration: new Date(),
      dateExpiration: dateExpiration,
      actif: true,
      cree_par: payload.userId,
    });

    return Response.json(qr, { status: 201 });
  } catch (error) {
    console.error('Error in POST QR Code API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

