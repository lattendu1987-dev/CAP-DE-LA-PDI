import "server-only";
import { headers } from "next/headers";
import { countryFromHeaders } from "./geo-headers";

/**
 * Pays du visiteur d'après son adresse IP, fourni par l'hébergeur (Vercel, Cloudflare)
 * sans service payant ni donnée personnelle conservée. Renvoie null si inconnu.
 */
export async function visitorCountry(): Promise<string | null> {
  const h = await headers();
  return countryFromHeaders(h);
}
