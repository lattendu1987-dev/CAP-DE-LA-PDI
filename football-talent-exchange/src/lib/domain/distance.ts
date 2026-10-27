// Distances sur la Terre (formule de haversine), pour la carte des détections.

export interface LatLng {
  lat: number;
  lng: number;
}

const EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

export function distanceKm(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Rayons proposés autour du joueur (km). */
export const RADIUS_OPTIONS = [25, 50, 100, 250, 500] as const;

export function parseLatLng(lat: unknown, lng: unknown): LatLng | null {
  const a = Number(lat), b = Number(lng);
  if (!Number.isFinite(a) || !Number.isFinite(b) || Math.abs(a) > 90 || Math.abs(b) > 180) return null;
  return { lat: a, lng: b };
}

export function parseRadius(v: unknown): number {
  const n = Number(v);
  return (RADIUS_OPTIONS as readonly number[]).includes(n) ? n : 100;
}

/** Garde les éléments situés dans le rayon et les trie du plus proche au plus lointain. */
export function nearby<T extends { latitude: number | null; longitude: number | null }>(items: T[], center: LatLng, radiusKm: number) {
  return items
    .flatMap((it) => (it.latitude == null || it.longitude == null ? [] : [{ item: it, km: distanceKm(center, { lat: it.latitude, lng: it.longitude }) }]))
    .filter((x) => x.km <= radiusKm)
    .sort((a, b) => a.km - b.km);
}

/** Lien d'itinéraire Google Maps (sans clé ; ouvre l'application Google Maps sur téléphone). */
export const directionsUrl = (lat: number, lng: number) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
