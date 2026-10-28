import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// Plan du site pour Google : pages publiques, profils publics de joueurs majeurs, détections à venir.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/inscription`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/detections`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/actualites`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/tarifs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/publicite`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/securite`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${base}/legal/cgu`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/legal/confidentialite`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    // Seuls les profils visibles par tout le monde : publiés, compte actif, joueur majeur.
    const adultBefore = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
    const [players, trials] = await Promise.all([
      db.playerProfile.findMany({
        where: { published: true, birthDate: { lte: adultBefore }, user: { suspended: false } },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5000,
      }),
      db.trialEvent.findMany({
        where: { startsAt: { gt: now }, recruiter: { suspended: false } },
        select: { id: true, createdAt: true },
        take: 1000,
      }),
    ]);
    return [
      ...pages,
      ...players.map((p) => ({ url: `${base}/joueurs/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...trials.map((t) => ({ url: `${base}/detections/${t.id}`, lastModified: t.createdAt, changeFrequency: "weekly" as const, priority: 0.6 })),
    ];
  } catch (e) {
    console.error("Plan du site : base de données indisponible", e);
    return pages;
  }
}
