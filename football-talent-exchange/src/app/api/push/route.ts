import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isValidSubscription } from "@/lib/domain/push";
import { allowLocalPushEndpoints, pushEnabled } from "@/lib/push";
import { appUrl } from "@/lib/email";

export const runtime = "nodejs";

/** Refuse les appels venant d'un autre site. */
function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === (req.headers.get("host") ?? new URL(appUrl()).host);
  } catch {
    return false;
  }
}

// Enregistre cet appareil pour recevoir les notifications.
export async function POST(req: Request) {
  if (!pushEnabled()) return new Response("Désactivé", { status: 404 });
  if (!sameOrigin(req)) return new Response("Interdit", { status: 403 });
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const sub = await req.json().catch(() => null);
  if (!isValidSubscription(sub, allowLocalPushEndpoints())) return new Response("Abonnement invalide", { status: 400 });
  if ((await db.pushSubscription.count({ where: { userId: user.id } })) >= 10) {
    // On garde les 9 appareils les plus récents.
    const old = await db.pushSubscription.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" }, take: 1 });
    await db.pushSubscription.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
  }
  await db.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: req.headers.get("user-agent")?.slice(0, 200) },
    update: { userId: user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return Response.json({ ok: true });
}

// Désactive les notifications sur cet appareil.
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return new Response("Interdit", { status: 403 });
  const user = await getCurrentUser();
  if (!user) return new Response("Non connecté", { status: 401 });
  const body = (await req.json().catch(() => null)) as { endpoint?: string } | null;
  if (body?.endpoint) await db.pushSubscription.deleteMany({ where: { userId: user.id, endpoint: body.endpoint } });
  return Response.json({ ok: true });
}
