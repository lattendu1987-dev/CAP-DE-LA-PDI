"use client";

import { useEffect, useRef, useState } from "react";

interface Ad {
  id: string;
  headline: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  clickUrl: string;
  advertiser: string;
}

const SEEN = "fte-ad-seen";

/**
 * Pop-up sponsorisé : apparaît après quelques secondes, une seule fois par visite, se ferme
 * immédiatement (bouton, Échap ou clic à côté). La vidéo est muette et ne démarre qu'une fois affichée.
 */
export function AdInterstitialDialog({ ad, text }: { ad: Ad; text: { sponsored: string; close: string; learnMore: string } }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN)) return;
    } catch {}
    const timer = setTimeout(() => {
      try { sessionStorage.setItem(SEEN, "1"); } catch {}
      setOpen(true);
      fetch(ad.clickUrl, { method: "POST", keepalive: true }).catch(() => {});
    }, 6000);
    return () => clearTimeout(timer);
  }, [ad.clickUrl]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      onClose={() => setOpen(false)}
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      className="ad-dialog m-auto w-[min(92vw,520px)] overflow-hidden rounded-2xl p-0 backdrop:bg-black/70"
      aria-label={text.sponsored}
      data-testid="ad-interstitial"
    >
      {open && (
        <div className="relative bg-white">
          <button type="button" onClick={() => setOpen(false)} className="absolute end-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1.5 text-sm font-semibold text-white" autoFocus>
            ✕ {text.close}
          </button>
          {ad.mediaType === "video" ? (
            <video src={ad.mediaUrl} muted playsInline autoPlay loop preload="metadata" className="aspect-video w-full bg-black object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.mediaUrl} alt="" className="aspect-video w-full object-cover" />
          )}
          <div className="space-y-2 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{text.sponsored} · {ad.advertiser}</p>
            <p className="text-xl font-bold leading-snug" dir="auto">{ad.headline}</p>
            <a href={ad.clickUrl} target="_blank" rel="sponsored noopener" className="btn-primary" onClick={() => setOpen(false)}>{text.learnMore} ↗</a>
          </div>
        </div>
      )}
    </dialog>
  );
}
