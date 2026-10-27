import { COUNTRY_CODES } from "./domain/reference";

/** Pays du visiteur lu dans les en-têtes posés par l'hébergeur (Vercel, Cloudflare). */
export function countryFromHeaders(h: Pick<Headers, "get">): string | null {
  const raw = h.get("x-vercel-ip-country") || h.get("cf-ipcountry") || h.get("x-country-code") || "";
  const code = raw.trim().toUpperCase();
  return COUNTRY_CODES.includes(code) ? code : null;
}
