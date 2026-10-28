export interface CompletenessInput {
  photoUrl?: string | null;
  bio?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  foot?: string | null;
  mainPosition?: string | null;
  otherPositions?: string[];
  currentLevel?: string | null;
  languages?: string[];
  careerCount: number;
  statsCount: number;
  videoCount: number;
  momentCount: number;
}

export type TipKey = "photo" | "bio" | "body" | "foot" | "main" | "other" | "level" | "languages" | "career" | "stats" | "video" | "moments";

interface Rule {
  points: number;
  ok: (p: CompletenessInput) => boolean;
  tip: TipKey;
}

const RULES: Rule[] = [
  { points: 10, ok: (p) => !!p.photoUrl, tip: "photo" },
  { points: 5, ok: (p) => !!p.bio && p.bio.length >= 80, tip: "bio" },
  { points: 10, ok: (p) => !!p.heightCm && !!p.weightKg, tip: "body" },
  { points: 5, ok: (p) => !!p.foot, tip: "foot" },
  { points: 10, ok: (p) => !!p.mainPosition, tip: "main" },
  { points: 5, ok: (p) => (p.otherPositions?.length ?? 0) > 0, tip: "other" },
  { points: 5, ok: (p) => !!p.currentLevel, tip: "level" },
  { points: 5, ok: (p) => (p.languages?.length ?? 0) > 0, tip: "languages" },
  { points: 15, ok: (p) => p.careerCount > 0, tip: "career" },
  { points: 10, ok: (p) => p.statsCount > 0, tip: "stats" },
  { points: 15, ok: (p) => p.videoCount > 0, tip: "video" },
  { points: 5, ok: (p) => p.momentCount > 0, tip: "moments" },
];

export function completeness(p: CompletenessInput): { score: number; tips: TipKey[] } {
  let score = 0;
  const tips: TipKey[] = [];
  for (const r of RULES) {
    if (r.ok(p)) score += r.points;
    else tips.push(r.tip);
  }
  return { score, tips };
}
