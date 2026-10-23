export type VideoEmbed =
  | { provider: "youtube"; embedUrl: string }
  | { provider: "vimeo"; embedUrl: string }
  | { provider: "file"; embedUrl: string };

export function parseVideoUrl(raw: string): VideoEmbed | null {
  // Fichier envoyé directement et stocké localement.
  if (/^\/api\/media\/u\/[\w-]+\/video\/[\w-]+\.(mp4|mov|webm|3gp)$/.test(raw)) return { provider: "file", embedUrl: raw };
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{6,})/)?.[1];
    return id ? { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { provider: "youtube", embedUrl: `https://www.youtube-nocookie.com/embed/${id}` } : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.match(/^\/(\d+)/)?.[1];
    return id ? { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${id}` } : null;
  }
  if (/\.(mp4|webm|mov|3gp)$/i.test(url.pathname)) return { provider: "file", embedUrl: url.toString() };
  return null;
}

/** Ajoute le point de départ à l'URL d'intégration. */
export function embedAt(embed: VideoEmbed, seconds: number): string {
  if (embed.provider === "youtube") return `${embed.embedUrl}?start=${seconds}&autoplay=1`;
  if (embed.provider === "vimeo") return `${embed.embedUrl}#t=${seconds}s`;
  return `${embed.embedUrl}#t=${seconds}`;
}

/** "1:23" ou "01:02:03" -> secondes. */
export function parseTimestamp(s: string): number | null {
  const parts = s.trim().split(":").map((x) => Number(x));
  if (parts.length < 1 || parts.length > 3 || parts.some((n) => !Number.isInteger(n) || n < 0)) return null;
  return parts.reduce((acc, n) => acc * 60 + n, 0);
}

export function formatTimestamp(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
