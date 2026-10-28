"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { AD_DURATIONS, adPriceCents, moderateAd } from "@/lib/domain/ads";
import { MEDIA_RULES, ownsKey } from "@/lib/domain/media";
import { COUNTRY_CODES } from "@/lib/domain/reference";
import { MOBILE_MONEY } from "@/lib/domain/mobile-money";
import { storedSize } from "@/lib/storage";
import { startOneOffPayment } from "@/lib/checkout";
import { audit } from "@/lib/audit";
import { demoPaymentsAllowed } from "@/lib/payment-mode";
import { stripeEnabled } from "@/lib/stripe";
import { flutterwaveEnabled } from "@/lib/flutterwave";

const back = (path: string, key: "ok" | "erreur", msg: string): never => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

/** Création d'une campagne : validation automatique, paiement, puis mise en ligne sans intervention. */
export async function createAdAction(fd: FormData) {
  const user = await requireUser(["ADVERTISER"]);
  const m = await getMessages();
  const t = m.ads;
  const r = z
    .object({
      headline: z.string().trim().max(200),
      linkUrl: z.string().trim().max(500),
      storageKey: z.string().max(300),
      format: z.enum(["BANNER", "INTERSTITIAL"]),
      audience: z.enum(["ALL", "PLAYERS", "RECRUITERS"]),
      days: z.coerce.number().refine((d) => (AD_DURATIONS as readonly number[]).includes(d)),
      method: z.enum(["card", "mobile"]),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) back("/publicite/campagnes", "erreur", t.rejected.media);
  const d = r.data!;
  const countries = [...new Set(fd.getAll("countries").map(String))].filter((c) => COUNTRY_CODES.includes(c)).slice(0, 30);

  // Le visuel doit appartenir à cet annonceur et être bien arrivé sur le stockage.
  const ext = d.storageKey.split(".").pop() ?? "";
  const mime = Object.entries(MEDIA_RULES.ad.types).find(([, e]) => e === ext)?.[0] ?? "";
  const okKey = ownsKey(d.storageKey, user.id, "ad") && !!mime && (await storedSize(d.storageKey)) !== null;
  const mediaType = okKey ? (mime.startsWith("video/") ? "video" : "image") : null;

  const reasons = moderateAd({ headline: d.headline, linkUrl: d.linkUrl, mediaType });
  if (reasons.length > 0) {
    await audit(user.id, "ad.rejected", { reasons });
    back("/publicite/campagnes", "erreur", reasons.map((x) => t.rejected[x]).join(" "));
  }
  if (d.method === "mobile" && !MOBILE_MONEY[user.country]) back("/publicite/campagnes", "erreur", m.billing.flash.mobileUnavailable);

  const live = d.method === "mobile" ? flutterwaveEnabled() : stripeEnabled();
  if (!live && !demoPaymentsAllowed()) back("/publicite/campagnes", "erreur", m.billing.flash.soon);
  const priceCents = adPriceCents(d.format, d.days, countries.length);
  const campaign = await db.adCampaign.create({
    data: {
      advertiserId: user.id, headline: d.headline, linkUrl: new URL(d.linkUrl).toString(), mediaKey: d.storageKey, mediaType: mediaType!,
      format: d.format, audience: d.audience, countries, days: d.days, priceCents,
    },
  });
  await audit(user.id, "ad.created", { id: campaign.id, priceCents });
  const res = await startOneOffPayment({
    user, purpose: "AD", usdCents: priceCents, method: d.method, adCampaignId: campaign.id,
    title: `Football Talent Exchange — ${t.formats[d.format][0]} (${t.days(d.days)})`, returnPath: "/publicite/campagnes",
  });
  if ("redirectTo" in res) redirect(res.redirectTo);
  if ("unavailable" in res) back("/publicite/campagnes", "erreur", m.billing.flash.soon);
  back("/publicite/campagnes", "ok", t.launched);
}

/** L'annonceur (ou l'équipe) peut arrêter une campagne à tout moment. */
export async function stopAdAction(fd: FormData) {
  const user = await requireUser(["ADVERTISER", "ADMIN"]);
  const m = await getMessages();
  const id = String(fd.get("id"));
  const where = user.role === "ADMIN" ? { id } : { id, advertiserId: user.id };
  await db.adCampaign.updateMany({ where: { ...where, status: "ACTIVE" }, data: { status: "STOPPED" } });
  await audit(user.id, "ad.stopped", { id });
  back("/publicite/campagnes", "ok", m.ads.stopped);
}
