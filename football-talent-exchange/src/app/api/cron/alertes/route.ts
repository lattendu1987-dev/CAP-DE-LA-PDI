import { db } from "@/lib/db";
import { cronAuthorized } from "@/lib/cron";
import { buildPlayerWhere, parseFilters } from "@/lib/domain/search";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { appUrl, sendEmail } from "@/lib/email";
import { positionLabel } from "@/lib/domain/reference";

export const runtime = "nodejs";

// Envoie à chaque recruteur abonné les nouveaux joueurs correspondant à ses recherches sauvegardées.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Non autorisé", { status: 401 });
  const searches = await db.savedSearch.findMany({ where: { alertsEnabled: true }, include: { recruiter: { include: { user: { include: { subscription: true } } } } } });
  let sent = 0;
  for (const s of searches) {
    const u = s.recruiter.user;
    if (u.suspended || !isSubscriptionActive(u.subscription)) continue;
    const now = new Date();
    const filters = parseFilters(Object.fromEntries(new URLSearchParams(s.query)));
    const matches = await db.playerProfile.findMany({
      where: { AND: [buildPlayerWhere(filters, now, { includeMinors: s.recruiter.verification === "VERIFIED" }), { OR: [{ createdAt: { gt: s.lastAlertAt } }, { guardianConsentAt: { gt: s.lastAlertAt } }] }] },
      take: 10,
      orderBy: { createdAt: "desc" },
    });
    await db.savedSearch.update({ where: { id: s.id }, data: { lastAlertAt: now } });
    if (matches.length === 0) continue;
    await sendEmail(
      u.email,
      `${matches.length} nouveau(x) joueur(s) pour « ${s.name} »`,
      matches.map((m) => `• ${m.firstName} ${m.lastName} — ${positionLabel(m.mainPosition)} : ${appUrl()}/joueurs/${m.slug}`).join("\n") +
        `\n\nVoir tous les résultats : ${appUrl()}/recruteur/recherche?${s.query}`,
    );
    sent++;
  }
  return Response.json({ searches: searches.length, sent });
}
