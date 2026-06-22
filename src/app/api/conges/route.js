import dbConnect from '@/lib/db';
import Conge from '@/models/Conge';
import Notification from '@/models/Notification';
import { verifyAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const QUOTA_ANNUEL = 25; // Annual leave quota in days

export async function GET(req) {
  try {
    await dbConnect();
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = {};

    if (payload.role === 'ADMIN') {
      const employeId = searchParams.get('employe');
      const statut = searchParams.get('statut');

      if (employeId) filter.employe = employeId;
      if (statut) filter.statut = statut;
    } else {
      // Employees only see their own requests
      filter.employe = payload.userId;
    }

    const conges = await Conge.find(filter)
      .populate('employe', 'nom email matricule departement')
      .populate('traite_par', 'nom')
      .sort({ createdAt: -1 });

    // For employees, also calculate and return their leave balance
    if (payload.role === 'EMPLOYE') {
      // Calculate used days this year (only VALIDE leaves)
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
      const endOfYear = new Date(Date.UTC(currentYear, 12, 31, 23, 59, 59, 999));

      const approvedConges = await Conge.find({
        employe: payload.userId,
        statut: 'VALIDE',
        date_debut: { $gte: startOfYear },
        date_fin: { $lte: endOfYear },
      });

      let joursUtilises = 0;
      approvedConges.forEach((c) => {
        const diffTime = Math.abs(new Date(c.date_fin) - new Date(c.date_debut));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        joursUtilises += diffDays;
      });

      const soldeRestant = QUOTA_ANNUEL - joursUtilises;

      return Response.json({ conges, balance: { quota: QUOTA_ANNUEL, utilises: joursUtilises, solde: soldeRestant } }, { status: 200 });
    }

    return Response.json({ conges }, { status: 200 });
  } catch (error) {
    console.error('Error in GET conges:', error);
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
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { date_debut, date_fin, type, motif } = await req.json();

    if (!date_debut || !date_fin || !type) {
      return Response.json(
        { error: 'Champs obligatoires : date_debut, date_fin et type' },
        { status: 400 }
      );
    }

    const start = new Date(date_debut);
    const end = new Date(date_fin);

    if (start >= end) {
      return Response.json(
        { error: 'La date de début doit être antérieure à la date de fin' },
        { status: 400 }
      );
    }

    // Calculate requested duration
    const requestedDiffTime = Math.abs(end - start);
    const requestedDays = Math.ceil(requestedDiffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check balance
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(Date.UTC(currentYear, 0, 1));
    const endOfYear = new Date(Date.UTC(currentYear, 12, 31, 23, 59, 59, 999));

    const approvedConges = await Conge.find({
      employe: payload.userId,
      statut: 'VALIDE',
      date_debut: { $gte: startOfYear },
      date_fin: { $lte: endOfYear },
    });

    let joursUtilises = 0;
    approvedConges.forEach((c) => {
      const diffTime = Math.abs(new Date(c.date_fin) - new Date(c.date_debut));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      joursUtilises += diffDays;
    });

    const soldeRestant = QUOTA_ANNUEL - joursUtilises;

    if (requestedDays > soldeRestant) {
      return Response.json(
        { error: `Solde insuffisant. Vous demandez ${requestedDays} jours, mais votre solde restant est de ${soldeRestant} jours.` },
        { status: 400 }
      );
    }

    // Create leave request
    const conge = await Conge.create({
      employe: payload.userId,
      date_debut: start,
      date_fin: end,
      type,
      motif,
      statut: 'EN_ATTENTE',
    });

    // Notify admins (create notification with no specific employee to mark for admins)
    await Notification.create({
      employe: null, // null = target admins
      titre: 'Nouvelle demande de congé',
      message: `L'employé(e) a fait une demande de congé ${type} de ${requestedDays} jours.`,
      type: 'CONGE',
    });

    return Response.json(
      { message: 'Demande de congé soumise avec succès.', conge },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST conges:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}

