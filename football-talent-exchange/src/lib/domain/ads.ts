// Régie publicitaire : prix et validation automatique des annonces (sans intervention manuelle).
import { detectScam } from "./scam";

export type AdFormat = "BANNER" | "INTERSTITIAL";
export type AdAudience = "ALL" | "PLAYERS" | "RECRUITERS";

export const AD_FORMATS: Record<AdFormat, { perDayUsd: number }> = { BANNER: { perDayUsd: 3 }, INTERSTITIAL: { perDayUsd: 6 } };
export const AD_DURATIONS = [7, 14, 30] as const;
export const AD_AUDIENCES: AdAudience[] = ["ALL", "PLAYERS", "RECRUITERS"];
/** Diffusion dans le monde entier (aucun pays choisi) : +50 %. */
export const WORLDWIDE_FACTOR = 1.5;

export function adPriceCents(format: AdFormat, days: number, countryCount: number): number {
  const base = AD_FORMATS[format].perDayUsd * days * 100;
  return Math.round(countryCount === 0 ? base * WORLDWIDE_FACTOR : base);
}

export type AdRejection = "link" | "shortener" | "headline" | "scam" | "forbidden" | "media";

const SHORTENERS = /^(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly|cutt\.ly|shorturl\.at|rb\.gy|t\.ly|s\.id|tiny\.cc|lnkd\.in)$/i;
// Le site est utilisé par des mineurs : ces secteurs sont refusés d'office (5 langues).
const FORBIDDEN = /\b(paris\s+sportifs?|parions|pronostics?|bet(ting)?|1xbet|bet365|betway|casino|poker|jackpot|apuestas?|apostas?|cassino|alcool|alcohol|álcool|bière|beer|cerveza|cerveja|vodka|whisky|tabac|tobacco|tabaco|cigarettes?|vape|chicha|shisha|porn\w*|xxx|adultes?\s+uniquement|escort|sex\w*)\b|(مراهن|كازينو|خمر|كحول|تبغ|سجائر)/i;

/** Validation automatique : renvoie la liste des motifs de refus (vide = acceptée). */
export function moderateAd(input: { headline: string; linkUrl: string; mediaType: string | null }): AdRejection[] {
  const reasons = new Set<AdRejection>();
  const headline = input.headline.trim();
  if (headline.length < 5 || headline.length > 90) reasons.add("headline");
  let url: URL | null = null;
  try {
    url = new URL(input.linkUrl.trim());
  } catch {}
  const host = url?.hostname ?? "";
  if (!url || url.protocol !== "https:" || url.username || url.password || !host.includes(".") || /^[\d.]+$/.test(host) || host === "localhost" || host.endsWith(".local")) reasons.add("link");
  else if (SHORTENERS.test(host.replace(/^www\./, ""))) reasons.add("shortener");
  const text = `${headline} ${input.linkUrl}`;
  if (detectScam(headline).length > 0) reasons.add("scam");
  if (FORBIDDEN.test(text)) reasons.add("forbidden");
  if (input.mediaType !== "image" && input.mediaType !== "video") reasons.add("media");
  return [...reasons];
}

/** Une campagne est-elle diffusable pour ce visiteur ? */
export function adMatches(ad: { audience: AdAudience; countries: string[] }, viewer: { country: string | null; role: string | null }): boolean {
  if (ad.countries.length > 0 && (!viewer.country || !ad.countries.includes(viewer.country))) return false;
  if (ad.audience === "PLAYERS") return viewer.role === null || viewer.role === "PLAYER" || viewer.role === "GUARDIAN";
  if (ad.audience === "RECRUITERS") return viewer.role === "RECRUITER";
  return true;
}
