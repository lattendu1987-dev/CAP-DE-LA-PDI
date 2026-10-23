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

interface Rule {
  points: number;
  ok: (p: CompletenessInput) => boolean;
  tip: string;
}

const RULES: Rule[] = [
  { points: 10, ok: (p) => !!p.photoUrl, tip: "Ajoute une photo de profil nette, en tenue." },
  { points: 5, ok: (p) => !!p.bio && p.bio.length >= 80, tip: "Écris une présentation d'au moins 80 caractères." },
  { points: 10, ok: (p) => !!p.heightCm && !!p.weightKg, tip: "Indique ta taille et ton poids." },
  { points: 5, ok: (p) => !!p.foot, tip: "Précise ton pied fort." },
  { points: 10, ok: (p) => !!p.mainPosition, tip: "Choisis ton poste principal." },
  { points: 5, ok: (p) => (p.otherPositions?.length ?? 0) > 0, tip: "Ajoute au moins un poste secondaire." },
  { points: 5, ok: (p) => !!p.currentLevel, tip: "Indique ton niveau de compétition actuel." },
  { points: 5, ok: (p) => (p.languages?.length ?? 0) > 0, tip: "Indique les langues que tu parles." },
  { points: 15, ok: (p) => p.careerCount > 0, tip: "Ajoute ton parcours (clubs, académies)." },
  { points: 10, ok: (p) => p.statsCount > 0, tip: "Ajoute tes statistiques de la dernière saison." },
  { points: 15, ok: (p) => p.videoCount > 0, tip: "Ajoute une vidéo de tes meilleures actions : c'est ce que les recruteurs regardent en premier." },
  { points: 5, ok: (p) => p.momentCount > 0, tip: "Marque les moments clés de tes vidéos (ex. 01:12 — but)." },
];

export function completeness(p: CompletenessInput): { score: number; tips: string[] } {
  let score = 0;
  const tips: string[] = [];
  for (const r of RULES) {
    if (r.ok(p)) score += r.points;
    else tips.push(r.tip);
  }
  return { score, tips };
}
