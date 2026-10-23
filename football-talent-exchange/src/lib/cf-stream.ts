import "server-only";

/**
 * Cloudflare Stream (optionnel) : chaque vidéo est convertie en plusieurs qualités,
 * et le lecteur choisit automatiquement celle qui passe sur le réseau du recruteur (3G, 4G, wifi).
 */
export const streamEnabled = () => !!(process.env.CF_ACCOUNT_ID && process.env.CF_STREAM_TOKEN);

const api = (path: string) => `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream${path}`;
const headers = () => ({ Authorization: `Bearer ${process.env.CF_STREAM_TOKEN}`, "Content-Type": "application/json" });

/** Limite d'un envoi direct simple vers Stream. */
export const STREAM_MAX_BYTES = 200 * 1024 * 1024;

export async function createStreamUpload(userId: string, maxDurationSeconds = 3 * 3600) {
  const res = await fetch(api("/direct_upload"), {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ maxDurationSeconds, requireSignedURLs: false, meta: { userId } }),
    cache: "no-store",
  });
  const json = (await res.json()) as { success: boolean; result?: { uploadURL: string; uid: string } };
  if (!res.ok || !json.success || !json.result) throw new Error(`Cloudflare Stream ${res.status}`);
  return json.result;
}

/** Vérifie qu'une vidéo Stream existe et appartient bien à cet utilisateur. */
export async function streamVideoOwnedBy(uid: string, userId: string): Promise<boolean> {
  if (!/^[a-f0-9]{32}$/.test(uid)) return false;
  const res = await fetch(api(`/${uid}`), { headers: headers(), cache: "no-store" });
  if (!res.ok) return false;
  const json = (await res.json()) as { result?: { meta?: Record<string, string>; status?: { state?: string } } };
  return json.result?.meta?.userId === userId && json.result?.status?.state !== "error";
}

export async function deleteStreamVideo(uid: string) {
  await fetch(api(`/${uid}`), { method: "DELETE", headers: headers() }).catch(() => {});
}

export const streamPlayerUrl = (uid: string) => `https://iframe.videodelivery.net/${uid}`;
