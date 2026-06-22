import dbConnect from '@/lib/db';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const filter = {};
    if (payload.role === 'ADMIN') {
      filter.employe = null; // Admin-level notifications
    } else {
      filter.employe = payload.userId; // Employee-level notifications
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    return Response.json(notifications, { status: 200 });
  } catch (error) {
    console.error('Error in GET notifications:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { notificationId } = await req.json();

    if (!notificationId) {
      // Mark all as read
      const filter = payload.role === 'ADMIN' ? { employe: null } : { employe: payload.userId };
      await Notification.updateMany(filter, { lu: true });
      return Response.json({ message: 'Toutes les notifications ont été marquées comme lues' }, { status: 200 });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return Response.json({ error: 'Notification non trouvée' }, { status: 404 });
    }

    // Verify ownership
    if (payload.role !== 'ADMIN' && notification.employe?.toString() !== payload.userId) {
      return Response.json({ error: 'Non autorisé' }, { status: 403 });
    }

    notification.lu = true;
    await notification.save();

    return Response.json({ message: 'Notification marquée comme lue', notification }, { status: 200 });
  } catch (error) {
    console.error('Error in PUT notifications:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

