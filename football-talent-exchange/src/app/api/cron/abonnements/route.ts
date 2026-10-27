import { db } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron";
import { releaseCommissions } from "@/lib/referral";
import { appUrl, sendEmail } from "@/lib/email";
import { messagesFor } from "@/i18n/server";
import { formatDate } from "@/i18n/format";
import { isLocale } from "@/i18n/config";
import { endExpiredAds } from "@/lib/ads";

export const runtime = "nodejs";

// Tâche quotidienne : fin des essais et abonnements expirés, rappels, commissions disponibles, ménage.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Non autorisé", { status: 401 });
  const now = new Date();
  const expired = await db.subscription.findMany({ where: { plan: { not: "FREE" }, status: { not: "CANCELED" }, currentPeriodEnd: { lt: now } } });
  for (const s of expired) {
    await db.subscription.update({ where: { id: s.id }, data: { status: "CANCELED" } });
    if (s.plan === "PLAYER_PREMIUM") await db.playerProfile.updateMany({ where: { userId: s.userId }, data: { featuredUntil: null } });
  }
  const in2 = new Date(now.getTime() + 2 * 86400000);
  const in3 = new Date(now.getTime() + 3 * 86400000);
  // Essais gratuits qui se terminent dans 3 jours.
  const trials = await db.subscription.findMany({ where: { status: "TRIALING", currentPeriodEnd: { gt: in2, lte: in3 } }, include: { user: true } });
  for (const s of trials) {
    const m = messagesFor(s.user.locale);
    await sendEmail(s.user.email, m.email.trialEndingSubject, m.email.trialEndingBody(`${appUrl()}/abonnement`));
  }
  // Abonnements prépayés (mobile money) sans renouvellement automatique.
  const prepaid = await db.subscription.findMany({ where: { status: "ACTIVE", plan: { not: "FREE" }, stripeSubscriptionId: null, currentPeriodEnd: { gt: in2, lte: in3 } }, include: { user: true } });
  for (const s of prepaid) {
    const m = messagesFor(s.user.locale);
    const locale = isLocale(s.user.locale) ? s.user.locale : "fr";
    await sendEmail(s.user.email, m.email.renewSubject, m.email.renewBody(formatDate(s.currentPeriodEnd, locale), `${appUrl()}/abonnement`));
  }
  const released = await releaseCommissions(now);
  await db.payment.updateMany({ where: { status: "PENDING", createdAt: { lt: new Date(now.getTime() - 2 * 86400000) } }, data: { status: "FAILED" } });
  const { count: sessions } = await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  // Fin des Boosts et des campagnes publicitaires arrivés à échéance.
  const boostsEnded = (await db.playerProfile.updateMany({ where: { boostedUntil: { lt: now } }, data: { boostedUntil: null } })).count;
  const adsEnded = await endExpiredAds(now);
  return Response.json({ expired: expired.length, trialReminders: trials.length, renewReminders: prepaid.length, commissionsReleased: released, sessions, boostsEnded, adsEnded });
}
