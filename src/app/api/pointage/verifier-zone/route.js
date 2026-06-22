import dbConnect from '@/lib/db';
import ZoneAutorisee from '@/models/ZoneAutorisee';
import { verifyAuth } from '@/lib/auth';

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth radius in meters
  const toRad = (value) => (value * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

export async function POST(req) {
  try {
    await dbConnect();
    
    // Verify authentication
    const payload = await verifyAuth(req);
    
    if (!payload || payload.role !== 'EMPLOYE') {
      return Response.json({ error: 'Non autorisé.' }, { status: 401 });
    }

    const { lat, lng } = await req.json();

    if (lat === undefined || lng === undefined) {
      return Response.json({ error: 'Coordonnées GPS manquantes.' }, { status: 400 });
    }

    const zones = await ZoneAutorisee.find({ actif: true });

    if (!zones || zones.length === 0) {
      // If no zones are defined, we might want to either block or allow.
      // We will allow by default if no zones exist for backward compatibility,
      // but return a generic zone_id.
      return Response.json({ zone_nom: 'Locaux' }, { status: 200 });
    }

    let insideZone = null;

    for (const zone of zones) {
      const distance = calculateDistance(lat, lng, zone.latitudeCentre, zone.longitudeCentre);
      if (distance <= zone.rayonMetres) {
        insideZone = zone;
        break;
      }
    }

    if (insideZone) {
      return Response.json({ 
        zone_id: insideZone._id, 
        zone_nom: insideZone.nom 
      }, { status: 200 });
    } else {
      return Response.json({ 
        error: 'Hors zone autorisée. Vous êtes trop éloigné du lieu de travail.' 
      }, { status: 403 });
    }

  } catch (error) {
    console.error('Erreur API verifier-zone:', error);
    return Response.json({ error: 'Erreur interne du serveur.' }, { status: 500 });
  }
}
