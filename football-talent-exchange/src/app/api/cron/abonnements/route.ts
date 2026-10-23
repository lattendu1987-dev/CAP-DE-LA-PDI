import { db } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron";
import { appUrl, sendEmail } from "@/lib/email";

export const runtime = "nodejs";

// Termine les essais et abonnements expirés, prévient les recruteurs 3 jours avant la fin de l'essai,
// et nettoie les sessions expirées.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Non autorisé", { status: 401 });
  const now = new Date();
  const expired = await db.subscription.findMany({ where: { plan: { not: "FREE" }, status: { not: "CANCELED" }, currentPeriodEnd: { lt: now } } });
  for (const s of expired) {
    await db.subscription.update({ where: { id: s.id }, data: { status: "CANCELED" } });
    if (s.plan === "PLAYER_PREMIUM") await db.playerProfile.updateMany({ where: { userId: s.userId }, data: { featuredUntil: null } });
  }
  const in3 = new Date(now.getTime() + 3 * 86400000);
  const in2 = new Date(now.getTime() + 2 * 86400000);
  const ending = await db.subscription.findMany({ where: { status: "TRIALING", currentPeriodEnd: { gt: in2, lte: in3 } }, include: { user: true } });
  for (const s of ending) {
    await sendEmail(s.user.email, "Ton essai gratuit se termine dans 3 jours", `Pour continuer à contacter les joueurs, choisis ton abonnement : ${appUrl()}/abonnement`);
  }
  const { count: sessions } = await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  return Response.json({ expired: expired.length, trialReminders: ending.length, sessions });
}
