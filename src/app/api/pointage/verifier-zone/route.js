import dbConnect from '@/lib/db';
import ZoneAutorisee from '@/models/ZoneAutorisee';
import { verifyAuth } from '@/lib/auth';
import { getDistance } from '@/lib/haversine';

export async function POST(req) {
  try {
    await dbConnect();

    // Verify auth
    const payload = await verifyAuth(req);
    if (!payload) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { latitude, longitude } = await req.json();

    if (latitude === undefined || longitude === undefined) {
      return Response.json(
        { error: 'Coordonnées GPS requises (latitude, longitude)' },
        { status: 400 }
      );
    }

    // --- Auto-seed Grand Casablanca if it doesn't exist ---
    try {
      await ZoneAutorisee.findOneAndUpdate(
        { nom: 'Grand Casablanca' },
        {
          nom: 'Grand Casablanca',
          latitudeCentre: 33.5731,
          longitudeCentre: -7.5898,
          rayonMetres: 50000,
          actif: true
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      await ZoneAutorisee.deleteMany({ nom: { $ne: 'Grand Casablanca' } }); // Clear other smaller zones
    } catch (seedError) {
      console.error('Info: Auto-seed race condition handled', seedError.message);
    }
    // -----------------------------------------------------

    // Get active zones
    const zones = await ZoneAutorisee.find({ actif: true });
    
    let closestZone = null;
    let minDistance = Infinity;

    for (const zone of zones) {
      const distance = getDistance(
        latitude,
        longitude,
        zone.latitudeCentre,
        zone.longitudeCentre
      );
      if (distance <= zone.rayonMetres) {
        return Response.json({
          withinZone: true,
          zone: {
            _id: zone._id,
            nom: zone.nom,
            distance: Math.round(distance),
            rayon: zone.rayonMetres,
          },
        });
      }
      if (distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    }

    return Response.json(
      {
        withinZone: false,
        error: 'Vous êtes hors de la zone de pointage autorisée.',
        details: closestZone
          ? `La zone la plus proche (${closestZone.nom}) est à ${Math.round(minDistance)}m (limite: ${closestZone.rayonMetres}m).`
          : 'Aucune zone active définie.',
      },
      { status: 403 }
    );
  } catch (error) {
    console.error('Error in verifier-zone API:', error);
    return Response.json(
      { error: 'Une erreur interne est survenue' },
      { status: 500 }
    );
  }
}
