import { countryTier, type PriceTier } from "./reference";

export type PaidPlan = "PLAYER_PREMIUM" | "RECRUITER_PRO" | "RECRUITER_CLUB";
export type Interval = "MONTH" | "YEAR";

export const PLAN_INFO: Record<PaidPlan, { name: string; audience: "PLAYER" | "RECRUITER"; baseMonthlyUsd: number; features: string[] }> = {
  PLAYER_PREMIUM: {
    name: "Joueur Premium",
    audience: "PLAYER",
    baseMonthlyUsd: 9,
    features: [
      "Vidéos illimitées (gratuit : 1 vidéo)",
      "Profil mis en avant dans les recherches",
      "Statistiques : qui consulte ton profil",
      "Vérification prioritaire de tes statistiques",
    ],
  },
  RECRUITER_PRO: {
    name: "Recruteur Pro",
    audience: "RECRUITER",
    baseMonthlyUsd: 49,
    features: [
      "Recherche complète et comparateur",
      "Contact direct : 20 nouvelles conversations / jour",
      "Listes de suivi et évaluations",
      "Alertes automatiques sur nouveaux profils",
    ],
  },
  RECRUITER_CLUB: {
    name: "Club",
    audience: "RECRUITER",
    baseMonthlyUsd: 149,
    features: [
      "Tout Recruteur Pro",
      "Contact direct : 60 nouvelles conversations / jour",
      "Idéal pour une cellule de recrutement",
    ],
  },
};

const TIER_MULTIPLIER: Record<PriceTier, number> = { A: 1, B: 0.6, C: 0.35 };

/** Prix en cents USD, arrondi au dollar. L'annuel = 10 mois (2 mois offerts). */
export function priceCents(plan: PaidPlan, interval: Interval, country: string): number {
  const monthly = Math.max(1, Math.round(PLAN_INFO[plan].baseMonthlyUsd * TIER_MULTIPLIER[countryTier(country)]));
  return (interval === "YEAR" ? monthly * 10 : monthly) * 100;
}

export function formatUsd(cents: number): string {
  return `${(cents / 100).toFixed(0)} $ US`;
}

export const TRIAL_DAYS = 14;

export const DAILY_NEW_CONVERSATIONS: Record<string, number> = {
  TRIAL: 5,
  RECRUITER_PRO: 20,
  RECRUITER_CLUB: 60,
};

export const FREE_VIDEO_LIMIT = 1;
