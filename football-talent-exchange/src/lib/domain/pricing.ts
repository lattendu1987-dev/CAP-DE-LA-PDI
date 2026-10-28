import { countryTier, type PriceTier } from "./reference";
import { fxRates } from "./mobile-money";

export type PaidPlan = "PLAYER_PREMIUM" | "RECRUITER_PRO" | "RECRUITER_CLUB";
export type Interval = "MONTH" | "YEAR";

export const PLAN_INFO: Record<PaidPlan, { audience: "PLAYER" | "RECRUITER"; baseMonthlyUsd: number }> = {
  PLAYER_PREMIUM: { audience: "PLAYER", baseMonthlyUsd: 9 },
  RECRUITER_PRO: { audience: "RECRUITER", baseMonthlyUsd: 49 },
  RECRUITER_CLUB: { audience: "RECRUITER", baseMonthlyUsd: 149 },
};

export const PAID_PLANS = Object.keys(PLAN_INFO) as PaidPlan[];

const TIER_MULTIPLIER: Record<PriceTier, number> = { A: 1, B: 0.6, C: 0.35 };

/** Pays d'Afrique (codes ISO) : tarif joueur avec un prix d'entrée minimum en FCFA. */
export const AFRICA = new Set([
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CG", "CD", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN",
  "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD",
  "TZ", "TG", "TN", "UG", "ZM", "ZW",
]);

/** Prix d'entrée minimum de l'abonnement joueur en Afrique, en francs CFA par mois. */
export const PLAYER_AFRICA_MIN_XOF = 2500;

/** Plancher africain converti en cents USD (au taux du franc CFA). */
export function africaPlayerFloorCents(rates = fxRates()): number {
  return Math.ceil((PLAYER_AFRICA_MIN_XOF / rates.XOF) * 100);
}

/**
 * Prix en cents USD selon le pays (parité de pouvoir d'achat), arrondi au dollar.
 * Joueurs en Afrique : jamais moins de 2 500 FCFA par mois. L'annuel = 10 mois (2 mois offerts).
 */
export function priceCents(plan: PaidPlan, interval: Interval, country: string, rates = fxRates()): number {
  let monthly = Math.max(1, Math.round(PLAN_INFO[plan].baseMonthlyUsd * TIER_MULTIPLIER[countryTier(country)])) * 100;
  if (plan === "PLAYER_PREMIUM" && AFRICA.has(country)) monthly = Math.max(monthly, africaPlayerFloorCents(rates));
  return interval === "YEAR" ? monthly * 10 : monthly;
}

/** Remise par rapport au plein tarif (en %), pour l'afficher au visiteur. */
export function discountPercent(country: string): number {
  return Math.round((1 - TIER_MULTIPLIER[countryTier(country)]) * 100);
}

/** Option « Boost » : le profil passe en tête des recherches des recruteurs. Paiement unique. */
export const BOOST_OPTIONS = { WEEK: { days: 7, baseUsd: 4 }, MONTH: { days: 30, baseUsd: 12 } } as const;
export type BoostOption = keyof typeof BOOST_OPTIONS;

export function boostCents(option: BoostOption, country: string): number {
  return Math.max(1, Math.round(BOOST_OPTIONS[option].baseUsd * TIER_MULTIPLIER[countryTier(country)])) * 100;
}

export const TRIAL_DAYS = 14;

export const DAILY_NEW_CONVERSATIONS: Record<string, number> = {
  TRIAL: 5,
  RECRUITER_PRO: 20,
  RECRUITER_CLUB: 60,
};

export const FREE_VIDEO_LIMIT = 1;
