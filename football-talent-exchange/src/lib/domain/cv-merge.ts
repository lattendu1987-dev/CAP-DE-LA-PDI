// Fusion prudente des informations lues dans un CV avec le profil existant :
// on ne remplit que les champs vides, on ajoute les clubs et saisons absents, on ne touche jamais
// à l'identité (nom, date de naissance) ni aux statistiques vérifiées. Les saisons ajoutées restent « déclarées ».
import { CAREER_KINDS, COUNTRY_CODES, LEVEL_CODES, POSITION_CODES } from "./reference";

export interface CvData {
  heightCm: number | null;
  weightKg: number | null;
  foot: string | null;
  mainPosition: string | null;
  otherPositions: string[];
  currentLevel: string | null;
  city: string | null;
  nationalities: string[];
  languages: string[];
  career: { club: string; kind: string; country: string | null; startYear: number; endYear: number | null }[];
  stats: { season: string; club: string; matches: number; goals: number; assists: number; minutes: number | null }[];
  summary: string | null;
}

export interface ProfileSnapshot {
  heightCm: number | null;
  weightKg: number | null;
  foot: string | null;
  mainPosition: string | null;
  otherPositions: string[];
  currentLevel: string | null;
  city: string | null;
  nationalities: string[];
  languages: string[];
  bio: string | null;
}

const between = (n: number | null, min: number, max: number) => (n !== null && Number.isInteger(n) && n >= min && n <= max ? n : null);
const clean = (s: string | null | undefined, max: number) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9]/g, "");

export function mergeCv(profile: ProfileSnapshot, existing: { career: { club: string; startYear: number }[]; stats: { season: string; club: string }[] }, cv: CvData, thisYear = new Date().getUTCFullYear()) {
  const data: Record<string, unknown> = {};
  const set = (field: keyof ProfileSnapshot, value: unknown) => {
    const current = profile[field];
    const empty = current === null || current === "" || (Array.isArray(current) && current.length === 0);
    const has = value !== null && value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0);
    if (empty && has) data[field] = value;
  };
  set("heightCm", between(cv.heightCm, 140, 220));
  set("weightKg", between(cv.weightKg, 40, 130));
  set("foot", cv.foot && ["RIGHT", "LEFT", "BOTH"].includes(cv.foot) ? cv.foot : null);
  const main = cv.mainPosition && (POSITION_CODES as readonly string[]).includes(cv.mainPosition) ? cv.mainPosition : null;
  set("mainPosition", main);
  set("otherPositions", [...new Set(cv.otherPositions.filter((p) => p !== (profile.mainPosition ?? main) && (POSITION_CODES as readonly string[]).includes(p)))].slice(0, 4));
  set("currentLevel", cv.currentLevel && (LEVEL_CODES as readonly string[]).includes(cv.currentLevel) ? cv.currentLevel : null);
  set("city", clean(cv.city, 80) || null);
  set("nationalities", [...new Set(cv.nationalities.map((c) => c.toUpperCase().slice(0, 2)).filter((c) => COUNTRY_CODES.includes(c)))].slice(0, 3));
  set("languages", [...new Set(cv.languages.map((l) => clean(l, 30)).filter(Boolean))].slice(0, 8));
  set("bio", clean(cv.summary, 1500) || null);

  const knownClubs = new Set(existing.career.map((c) => `${norm(c.club)}|${c.startYear}`));
  const career = cv.career
    .map((c) => ({ club: clean(c.club, 120), kind: (CAREER_KINDS as readonly string[]).includes(c.kind) ? c.kind : "CLUB", country: c.country && COUNTRY_CODES.includes(c.country.toUpperCase()) ? c.country.toUpperCase() : null, startYear: c.startYear, endYear: c.endYear }))
    .filter((c) => c.club && c.startYear >= 1990 && c.startYear <= thisYear && (c.endYear === null || (c.endYear >= c.startYear && c.endYear <= thisYear + 5)))
    .filter((c) => {
      const k = `${norm(c.club)}|${c.startYear}`;
      if (knownClubs.has(k)) return false;
      knownClubs.add(k);
      return true;
    })
    .slice(0, 15);

  const knownSeasons = new Set(existing.stats.map((s) => `${norm(s.season)}|${norm(s.club)}`));
  const stats = cv.stats
    .map((s) => ({ season: clean(s.season, 20), club: clean(s.club, 120), matches: between(s.matches, 0, 80) ?? 0, goals: between(s.goals, 0, 150) ?? 0, assists: between(s.assists, 0, 150) ?? 0, minutes: between(s.minutes, 0, 8000) ?? 0 }))
    .filter((s) => s.season && s.club && s.matches > 0)
    .filter((s) => {
      const k = `${norm(s.season)}|${norm(s.club)}`;
      if (knownSeasons.has(k)) return false;
      knownSeasons.add(k);
      return true;
    })
    .slice(0, 20);

  return { data, career, stats, filled: Object.keys(data).length };
}
