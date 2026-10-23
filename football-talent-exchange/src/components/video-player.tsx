"use client";
import { useEffect, useState } from "react";

/** Réseau lent (2G/3G) ou mode économie de données activé sur le téléphone. */
function useSlowNetwork() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (c && (c.saveData || ["slow-2g", "2g", "3g"].includes(c.effectiveType ?? ""))) setSlow(true);
  }, []);
  return slow;
}
import { embedAt, formatTimestamp, parseVideoUrl } from "@/lib/domain/video";

export function VideoPlayer({ url, title, moments }: { url: string; title: string; moments: { seconds: number; label: string }[] }) {
  const embed = parseVideoUrl(url);
  const [src, setSrc] = useState(embed?.embedUrl ?? "");
  const slow = useSlowNetwork();
  if (!embed) return <p className="muted">Vidéo indisponible.</p>;
  return (
    <div>
      <div className="aspect-video overflow-hidden rounded-xl bg-black">
        {embed.provider === "file" ? (
          <video key={src} src={src} controls playsInline className="h-full w-full" preload={slow ? "none" : "metadata"} />
        ) : (
          <iframe key={src} src={src} title={title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" />
        )}
      </div>
      {moments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {moments.map((m, i) => (
            <button key={i} type="button" onClick={() => setSrc(embedAt(embed, m.seconds))} className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs hover:border-pitch-500 hover:bg-pitch-50">
              <span className="font-mono font-semibold text-pitch-700">{formatTimestamp(m.seconds)}</span> {m.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
