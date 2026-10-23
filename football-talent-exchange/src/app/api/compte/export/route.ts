import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

// Droit d'accès / portabilité (RGPD, Loi 25) : export de toutes les données personnelles.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const data = await db.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, email: true, name: true, role: true, country: true, createdAt: true,
      player: { include: { career: true, stats: true, videos: { include: { moments: true } } } },
      recruiter: { include: { shortlists: { include: { items: true } }, savedSearches: true, evaluations: true } },
      subscription: { select: { plan: true, interval: true, status: true, currentPeriodEnd: true, amountCents: true } },
      messages: { select: { conversationId: true, body: true, createdAt: true } },
      reportsMade: { select: { reason: true, createdAt: true } },
      referralCode: true,
      payments: { select: { provider: true, plan: true, interval: true, usdCents: true, currency: true, amountMinor: true, status: true, createdAt: true } },
      commissionsEarned: { select: { amountCents: true, status: true, createdAt: true } },
      payouts: { select: { amountCents: true, method: true, status: true, createdAt: true } },
      trialApplications: { select: { trialId: true, status: true, message: true, createdAt: true } },
    },
  });
  return new Response(JSON.stringify(data, null, 2), {
    headers: { "Content-Type": "application/json", "Content-Disposition": `attachment; filename="mes-donnees-fte.json"` },
  });
}
