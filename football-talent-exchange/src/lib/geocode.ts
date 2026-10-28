import "server-only";
import type { LatLng } from "./domain/distance";

/**
 * Adresse -> coordonnées. Avec GOOGLE_MAPS_API_KEY : Google Geocoding ; sinon OpenStreetMap (Nominatim,
 * gratuit, usage modéré). En cas d'échec, renvoie null : la détection est publiée sans point sur la carte.
 */
const cache = new Map<string, LatLng | null>();

export async function geocode(q: { address?: string | null; city: string; country?: string | null }): Promise<LatLng | null> {
  const text = [q.address, q.city].filter(Boolean).join(", ");
  if (!text.trim()) return null;
  const key = `${text.toLowerCase()}|${q.country ?? ""}`;
  if (cache.has(key)) return cache.get(key)!;
  const found = await lookup(text, q.country);
  if (cache.size > 500) cache.clear();
  cache.set(key, found);
  return found;
}

async function lookup(text: string, country?: string | null): Promise<LatLng | null> {
  try {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (key) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(text)}${country ? `&components=country:${country}` : ""}&key=${key}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      const json = (await res.json()) as { results?: { geometry: { location: { lat: number; lng: number } } }[] };
      const loc = json.results?.[0]?.geometry.location;
      return loc ? { lat: loc.lat, lng: loc.lng } : null;
    }
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1${country ? `&countrycodes=${country.toLowerCase()}` : ""}&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": `FootballTalentExchange/1.0 (${process.env.SUPPORT_EMAIL || "support@example.com"})`, "Accept-Language": "fr" },
    });
    const json = (await res.json()) as { lat: string; lon: string }[];
    return json[0] ? { lat: Number(json[0].lat), lng: Number(json[0].lon) } : null;
  } catch {
    return null;
  }
}
