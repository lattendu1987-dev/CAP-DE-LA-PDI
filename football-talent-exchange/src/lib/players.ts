import "server-only";
import { db } from "./db";
import { isMinor } from "./domain/age";
import type { CurrentUser } from "./auth";

export async function loadPlayerBySlug(slug: string) {
  return db.playerProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, suspended: true, subscription: true } },
      career: { orderBy: { startYear: "desc" } },
      stats: { orderBy: { season: "desc" } },
      videos: { include: { moments: { orderBy: { seconds: "asc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
}

type Loaded = NonNullable<Awaited<ReturnType<typeof loadPlayerBySlug>>>;

/** Un profil est visible publiquement s'il est publié, non suspendu, et (si mineur) consenti. */
export function canView(p: Loaded, viewer: CurrentUser | null): boolean {
  if (viewer && (viewer.role === "ADMIN" || viewer.id === p.userId || viewer.id === p.guardianId)) return true;
  if (!p.published || p.user.suspended) return false;
  if (isMinor(p.birthDate) && !p.guardianConsentAt) return false;
  // Les profils de mineurs ne sont visibles que par des recruteurs vérifiés.
  if (isMinor(p.birthDate) && !(viewer?.role === "RECRUITER" && viewer.recruiter?.verification === "VERIFIED")) return false;
  return true;
}
