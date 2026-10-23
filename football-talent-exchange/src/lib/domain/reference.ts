// Données de référence : postes, niveaux, pays.

export const POSITIONS = [
  { code: "GB", label: "Gardien de but" },
  { code: "DD", label: "Défenseur latéral droit" },
  { code: "DG", label: "Défenseur latéral gauche" },
  { code: "DC", label: "Défenseur central" },
  { code: "MDC", label: "Milieu défensif" },
  { code: "MC", label: "Milieu central" },
  { code: "MOC", label: "Milieu offensif" },
  { code: "MD", label: "Milieu droit" },
  { code: "MG", label: "Milieu gauche" },
  { code: "AD", label: "Ailier droit" },
  { code: "AG", label: "Ailier gauche" },
  { code: "BU", label: "Avant-centre" },
] as const;

export type PositionCode = (typeof POSITIONS)[number]["code"];

export function positionLabel(code: string | null | undefined): string {
  return POSITIONS.find((p) => p.code === code)?.label ?? "—";
}

export const LEVELS = [
  { code: "PRO_TOP", label: "Professionnel (1re division)" },
  { code: "PRO_LOWER", label: "Professionnel (divisions inférieures)" },
  { code: "SEMI_PRO", label: "Semi-professionnel" },
  { code: "AMATEUR", label: "Amateur" },
  { code: "UNIVERSITY", label: "Universitaire" },
  { code: "YOUTH_ACADEMY", label: "Centre de formation / académie" },
  { code: "YOUTH", label: "Jeunes (club)" },
] as const;

export function levelLabel(code: string | null | undefined): string {
  return LEVELS.find((l) => l.code === code)?.label ?? "—";
}

export const FOOT_LABELS: Record<string, string> = {
  RIGHT: "Droit",
  LEFT: "Gauche",
  BOTH: "Ambidextre",
};

export const AVAILABILITY_LABELS: Record<string, string> = {
  IMMEDIATE: "Disponible immédiatement",
  END_OF_SEASON: "Disponible en fin de saison",
  TRIAL_ONLY: "Ouvert à un essai",
  NOT_AVAILABLE: "Non disponible",
};

export const RECRUITER_TYPE_LABELS: Record<string, string> = {
  CLUB: "Club",
  COACH: "Entraîneur",
  SCOUT: "Recruteur / scout",
  AGENT: "Agent licencié FIFA",
  TECHNICAL_DIRECTOR: "Directeur technique",
};

// Groupes de prix (parité de pouvoir d'achat). A = plein tarif.
export type PriceTier = "A" | "B" | "C";

export const COUNTRIES: { code: string; name: string; tier: PriceTier }[] = [
  { code: "CA", name: "Canada", tier: "A" },
  { code: "US", name: "États-Unis", tier: "A" },
  { code: "FR", name: "France", tier: "A" },
  { code: "BE", name: "Belgique", tier: "A" },
  { code: "CH", name: "Suisse", tier: "A" },
  { code: "GB", name: "Royaume-Uni", tier: "A" },
  { code: "DE", name: "Allemagne", tier: "A" },
  { code: "ES", name: "Espagne", tier: "A" },
  { code: "IT", name: "Italie", tier: "A" },
  { code: "NL", name: "Pays-Bas", tier: "A" },
  { code: "PT", name: "Portugal", tier: "B" },
  { code: "AE", name: "Émirats arabes unis", tier: "A" },
  { code: "SA", name: "Arabie saoudite", tier: "A" },
  { code: "QA", name: "Qatar", tier: "A" },
  { code: "TR", name: "Turquie", tier: "B" },
  { code: "PL", name: "Pologne", tier: "B" },
  { code: "MX", name: "Mexique", tier: "B" },
  { code: "BR", name: "Brésil", tier: "B" },
  { code: "AR", name: "Argentine", tier: "B" },
  { code: "CO", name: "Colombie", tier: "B" },
  { code: "MA", name: "Maroc", tier: "B" },
  { code: "DZ", name: "Algérie", tier: "C" },
  { code: "TN", name: "Tunisie", tier: "C" },
  { code: "EG", name: "Égypte", tier: "C" },
  { code: "SN", name: "Sénégal", tier: "C" },
  { code: "CI", name: "Côte d'Ivoire", tier: "C" },
  { code: "CM", name: "Cameroun", tier: "C" },
  { code: "ML", name: "Mali", tier: "C" },
  { code: "GN", name: "Guinée", tier: "C" },
  { code: "CD", name: "RD Congo", tier: "C" },
  { code: "NG", name: "Nigeria", tier: "C" },
  { code: "GH", name: "Ghana", tier: "C" },
  { code: "HT", name: "Haïti", tier: "C" },
  { code: "JP", name: "Japon", tier: "A" },
];

export function countryName(code: string | null | undefined): string {
  return COUNTRIES.find((c) => c.code === code)?.name ?? code ?? "—";
}

export function countryTier(code: string | null | undefined): PriceTier {
  return COUNTRIES.find((c) => c.code === code)?.tier ?? "B";
}
