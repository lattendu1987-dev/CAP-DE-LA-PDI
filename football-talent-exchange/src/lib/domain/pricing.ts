import { countryTier, type PriceTier } from "./reference";

export type PaidPlan = "PLAYER_PREMIUM" | "RECRUITER_PRO" | "RECRUITER_CLUB";
export type Interval = "MONTH" | "YEAR";

export const PLAN_INFO: Record<PaidPlan, { audience: "PLAYER" | "RECRUITER"; baseMonthlyUsd: number }> = {
  PLAYER_PREMIUM: { audience: "PLAYER", baseMonthlyUsd: 9 },
  RECRUITER_PRO: { audience: "RECRUITER", baseMonthlyUsd: 49 },
  RECRUITER_CLUB: { audience: "RECRUITER", baseMonthlyUsd: 149 },
};

export const PAID_PLANS = Object.keys(PLAN_INFO) as PaidPlan[];

const TIER_MULTIPLIER: Record<PriceTier, number> = { A: 1, B: 0.6, C: 0.35 };

/** Prix en cents USD, arrondi au dollar. L'annuel = 10 mois (2 mois offerts). */
export function priceCents(plan: PaidPlan, interval: Interval, country: string): number {
  const monthly = Math.max(1, Math.round(PLAN_INFO[plan].baseMonthlyUsd * TIER_MULTIPLIER[countryTier(country)]));
  return (interval === "YEAR" ? monthly * 10 : monthly) * 100;
}

export const TRIAL_DAYS = 14;

export const DAILY_NEW_CONVERSATIONS: Record<string, number> = {
  TRIAL: 5,
  RECRUITER_PRO: 20,
  RECRUITER_CLUB: 60,
};

export const FREE_VIDEO_LIMIT = 1;
