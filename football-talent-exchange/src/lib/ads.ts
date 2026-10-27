import "server-only";
import { db } from "./db";
import { publicUrl } from "./storage";
import { adMatches, type AdFormat } from "./domain/ads";
import { getCurrentUser } from "./auth";
import { visitorCountry } from "./geo";

export interface ServedAd {
  id: string;
  headline: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  clickUrl: string;
  advertiser: string;
}

/** Mise en ligne automatique dès que le paiement est confirmé. */
export async function activateAd(campaignId: string, now = new Date()) {
  const c = await db.adCampaign.findUnique({ where: { id: campaignId } });
  if (!c || c.status !== "PENDING_PAYMENT") return;
  await db.adCampaign.update({ where: { id: c.id }, data: { status: "ACTIVE", startsAt: now, endsAt: new Date(now.getTime() + c.days * 86400000) } });
}

/** Les campagnes arrivées à leur date de fin passent à « Terminée ». */
export async function endExpiredAds(now = new Date()) {
  return (await db.adCampaign.updateMany({ where: { status: "ACTIVE", endsAt: { lte: now } }, data: { status: "ENDED" } })).count;
}

/**
 * Choisit une campagne en ligne pour ce visiteur (pays, type de compte), au hasard parmi celles qui
 * correspondent, et compte un affichage. Les annonceurs ne voient pas de publicité.
 */
export async function pickAd(format: AdFormat, { count = true } = {}): Promise<ServedAd | null> {
  const [user, ipCountry] = await Promise.all([getCurrentUser(), visitorCountry()]);
  if (user?.role === "ADVERTISER") return null;
  const now = new Date();
  const live = await db.adCampaign.findMany({
    where: { status: "ACTIVE", format, endsAt: { gt: now } },
    select: { id: true, headline: true, mediaKey: true, mediaType: true, audience: true, countries: true, advertiser: { select: { name: true } } },
    take: 200,
  });
  const viewer = { country: user?.country ?? ipCountry, role: user?.role ?? null };
  const fit = live.filter((a) => adMatches(a, viewer));
  if (fit.length === 0) return null;
  const ad = fit[Math.floor(Math.random() * fit.length)];
  // Le pop-up compte son affichage lui-même, seulement s'il apparaît vraiment (une fois par visite).
  if (count) await db.adCampaign.update({ where: { id: ad.id }, data: { impressions: { increment: 1 } } });
  return {
    id: ad.id, headline: ad.headline, mediaUrl: publicUrl(ad.mediaKey), mediaType: ad.mediaType === "video" ? "video" : "image",
    clickUrl: `/api/pub/${ad.id}`, advertiser: ad.advertiser.name,
  };
}
