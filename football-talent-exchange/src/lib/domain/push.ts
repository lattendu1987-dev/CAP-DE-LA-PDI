// Règles des notifications sur le téléphone (Web Push).

/** Services de notification officiels (Chrome/Android, Firefox, Safari/iPhone, Edge). */
const PUSH_HOSTS = [/^fcm\.googleapis\.com$/, /^updates\.push\.services\.mozilla\.com$/, /^(web\.push|[\w-]+\.push)\.apple\.com$/, /^[\w.-]+\.notify\.windows\.com$/];

/**
 * Le serveur n'envoie des notifications qu'aux services officiels : empêche d'utiliser
 * la plateforme pour appeler n'importe quelle adresse (SSRF).
 */
export function isAllowedPushEndpoint(raw: string, allowLocal = false): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  // Tests automatiques uniquement : faux service de notification sur la machine.
  if (allowLocal && (u.protocol === "https:" || u.protocol === "http:") && (u.hostname === "localhost" || u.hostname === "127.0.0.1")) return true;
  if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return false;
  return PUSH_HOSTS.some((re) => re.test(u.hostname));
}

export function isValidSubscription(s: unknown, allowLocal = false): s is { endpoint: string; keys: { p256dh: string; auth: string } } {
  if (!s || typeof s !== "object") return false;
  const o = s as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const b64 = /^[A-Za-z0-9_-]+={0,2}$/;
  return (
    typeof o.endpoint === "string" && o.endpoint.length <= 1000 && isAllowedPushEndpoint(o.endpoint, allowLocal) &&
    typeof o.keys?.p256dh === "string" && b64.test(o.keys.p256dh) && o.keys.p256dh.length <= 200 &&
    typeof o.keys?.auth === "string" && b64.test(o.keys.auth) && o.keys.auth.length <= 100
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url: string; // page ouverte au toucher (chemin interne)
  tag: string; // remplace la notification précédente du même type
}

/** Un même recruteur ne déclenche qu'une notification « profil consulté » par joueur et par jour. */
export const PROFILE_VIEW_COOLDOWN_MS = 24 * 3600 * 1000;

export function safeInternalPath(p: string): string {
  return p.startsWith("/") && !p.startsWith("//") ? p : "/";
}
