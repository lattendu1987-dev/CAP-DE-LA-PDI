import { birthDateRangeForAge } from "./age";

export interface SearchFilters {
  q?: string;
  position?: string;
  foot?: "RIGHT" | "LEFT" | "BOTH";
  minAge?: number;
  maxAge?: number;
  minHeight?: number;
  country?: string;
  nationality?: string;
  level?: string;
  contract?: "FREE" | "UNDER_CONTRACT";
  availability?: string;
  withVideo?: boolean;
  verifiedStats?: boolean;
  relocate?: boolean;
}

const int = (v: string | undefined) => {
  if (v === undefined || v === "") return undefined;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < 300 ? n : undefined;
};
const str = (v: string | undefined) => (v && v.trim() ? v.trim().slice(0, 80) : undefined);

export function parseFilters(params: Record<string, string | string[] | undefined>): SearchFilters {
  const get = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const foot = get("foot");
  const contract = get("contract");
  return {
    q: str(get("q")),
    position: str(get("position")),
    foot: foot === "RIGHT" || foot === "LEFT" || foot === "BOTH" ? foot : undefined,
    minAge: int(get("minAge")),
    maxAge: int(get("maxAge")),
    minHeight: int(get("minHeight")),
    country: str(get("country")),
    nationality: str(get("nationality")),
    level: str(get("level")),
    contract: contract === "FREE" || contract === "UNDER_CONTRACT" ? contract : undefined,
    availability: str(get("availability")),
    withVideo: get("withVideo") === "1" || undefined,
    verifiedStats: get("verifiedStats") === "1" || undefined,
    relocate: get("relocate") === "1" || undefined,
  };
}

export function filtersToQueryString(f: SearchFilters): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(f)) {
    if (v === undefined || v === false) continue;
    sp.set(k, v === true ? "1" : String(v));
  }
  return sp.toString();
}

/** Construit le filtre Prisma. Seuls les profils publiés (et consentis pour les mineurs) sont visibles. */
export function buildPlayerWhere(f: SearchFilters, today: Date = new Date(), opts: { includeMinors?: boolean } = {}) {
  const and: Record<string, unknown>[] = [
    { published: true },
    { user: { suspended: false } },
    { OR: [{ guardianEmail: null }, { guardianConsentAt: { not: null } }] },
  ];
  if (!opts.includeMinors) and.push({ birthDate: birthDateRangeForAge(18, undefined, today) });
  if (f.q) {
    and.push({
      OR: [
        { firstName: { contains: f.q, mode: "insensitive" } },
        { lastName: { contains: f.q, mode: "insensitive" } },
        { city: { contains: f.q, mode: "insensitive" } },
        { career: { some: { club: { contains: f.q, mode: "insensitive" } } } },
      ],
    });
  }
  if (f.position) and.push({ OR: [{ mainPosition: f.position }, { otherPositions: { has: f.position } }] });
  if (f.foot) and.push(f.foot === "BOTH" ? { foot: "BOTH" } : { foot: { in: [f.foot, "BOTH"] } });
  if (f.minAge !== undefined || f.maxAge !== undefined) and.push({ birthDate: birthDateRangeForAge(f.minAge, f.maxAge, today) });
  if (f.minHeight) and.push({ heightCm: { gte: f.minHeight } });
  if (f.country) and.push({ country: f.country });
  if (f.nationality) and.push({ nationalities: { has: f.nationality } });
  if (f.level) and.push({ currentLevel: f.level });
  if (f.contract) and.push({ contractStatus: f.contract });
  if (f.availability) and.push({ availability: f.availability });
  if (f.withVideo) and.push({ videos: { some: {} } });
  if (f.verifiedStats) and.push({ stats: { some: { verified: true } } });
  if (f.relocate) and.push({ willingToRelocate: true });
  return { AND: and };
}
