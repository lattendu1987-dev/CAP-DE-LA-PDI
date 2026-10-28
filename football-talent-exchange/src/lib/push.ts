import "server-only";
import { Agent } from "node:https";
import webpush from "web-push";
import { after } from "next/server";
import { db } from "./db";
import { messagesFor } from "@/i18n/server";
import type { Messages } from "@/i18n/messages";
import { safeInternalPath, type PushPayload } from "./domain/push";

export const pushEnabled = () => !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
export const allowLocalPushEndpoints = () => process.env.PUSH_ALLOW_LOCAL_ENDPOINTS === "1";

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || `mailto:${process.env.SUPPORT_EMAIL || "support@example.com"}`, process.env.VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  configured = true;
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur, dans sa langue.
 * Les abonnements expirés (404/410) sont supprimés automatiquement. Ne lève jamais d'erreur.
 */
export async function notifyUser(userId: string, build: (m: Messages) => PushPayload) {
  if (!pushEnabled()) return 0;
  try {
    configure();
    const user = await db.user.findUnique({ where: { id: userId }, select: { locale: true, suspended: true, pushSubscriptions: true } });
    if (!user || user.suspended || user.pushSubscriptions.length === 0) return 0;
    const payload = build(messagesFor(user.locale));
    const body = JSON.stringify({ ...payload, url: safeInternalPath(payload.url) });
    let sent = 0;
    for (const s of user.pushSubscriptions) {
      try {
        // En test, le faux service local utilise un certificat auto-signé.
        const local = allowLocalPushEndpoints() && /^https:\/\/(localhost|127\.0\.0\.1)[:/]/.test(s.endpoint);
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, {
          TTL: 24 * 3600,
          urgency: "normal",
          topic: payload.tag.slice(0, 32).replace(/[^\w-]/g, "") || undefined,
          ...(local ? { agent: new Agent({ rejectUnauthorized: false }) } : {}),
        });
        sent++;
        await db.pushSubscription.update({ where: { id: s.id }, data: { lastUsedAt: new Date() } });
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await db.pushSubscription.delete({ where: { id: s.id } }).catch(() => {});
        else console.error("Notification non envoyée", status ?? e);
      }
    }
    return sent;
  } catch (e) {
    console.error("Erreur de notification", e);
    return 0;
  }
}

/** Programme la notification après l'envoi de la page (ou tout de suite hors requête). */
export function notifyLater(userId: string, build: (m: Messages) => PushPayload) {
  if (!pushEnabled()) return;
  try {
    after(() => notifyUser(userId, build));
  } catch {
    void notifyUser(userId, build);
  }
}
