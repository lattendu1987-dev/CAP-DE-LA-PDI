// Données de référence (codes). Les libellés sont dans les dictionnaires de langue.
import type { Messages } from "@/i18n/messages";

export const POSITION_CODES = ["GB", "DD", "DG", "DC", "MDC", "MC", "MOC", "MD", "MG", "AD", "AG", "BU"] as const;
export type PositionCode = (typeof POSITION_CODES)[number];

export const LEVEL_CODES = ["PRO_TOP", "PRO_LOWER", "SEMI_PRO", "AMATEUR", "UNIVERSITY", "YOUTH_ACADEMY", "YOUTH"] as const;
export const AVAILABILITY_CODES = ["IMMEDIATE", "END_OF_SEASON", "TRIAL_ONLY", "NOT_AVAILABLE"] as const;
export const RECRUITER_TYPES = ["CLUB", "COACH", "SCOUT", "AGENT", "TECHNICAL_DIRECTOR"] as const;
export const CAREER_KINDS = ["CLUB", "ACADEMY", "NATIONAL_TEAM", "REGIONAL_TEAM", "UNIVERSITY"] as const;

export function positionLabel(m: Messages, code: string | null | undefined): string {
  return (code && m.labels.positions[code as PositionCode]) || "—";
}
export function levelLabel(m: Messages, code: string | null | undefined): string {
  return (code && m.labels.levels[code as keyof Messages["labels"]["levels"]]) || "—";
}
export function footLabel(m: Messages, code: string | null | undefined): string {
  return (code && m.labels.foot[code as keyof Messages["labels"]["foot"]]) || "—";
}

// Groupes de prix (parité de pouvoir d'achat). A = plein tarif.
export type PriceTier = "A" | "B" | "C";

export const COUNTRY_TIERS: Record<string, PriceTier> = {
  CA: "A", US: "A", FR: "A", BE: "A", CH: "A", GB: "A", DE: "A", ES: "A", IT: "A", NL: "A", AE: "A", SA: "A", QA: "A", JP: "A", LU: "A", AU: "A",
  PT: "B", TR: "B", PL: "B", MX: "B", BR: "B", AR: "B", CO: "B", MA: "B", CL: "B", PE: "B", ZA: "B", GA: "B",
  DZ: "C", TN: "C", EG: "C", SN: "C", CI: "C", CM: "C", ML: "C", GN: "C", CD: "C", CG: "C", NG: "C", GH: "C", HT: "C", BF: "C",
  BJ: "C", TG: "C", NE: "C", KE: "C", UG: "C", TZ: "C", RW: "C", ZM: "C", MG: "C", TD: "C", BO: "C", VE: "C",
};

export const COUNTRY_CODES = Object.keys(COUNTRY_TIERS);

export function countryTier(code: string | null | undefined): PriceTier {
  return (code && COUNTRY_TIERS[code]) || "B";
}
