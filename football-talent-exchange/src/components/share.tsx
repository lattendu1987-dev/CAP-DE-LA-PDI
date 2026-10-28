"use client";
import { useState } from "react";

/** Boutons de partage : WhatsApp (très utilisé en Afrique et en Amérique latine) et copie du lien. */
export function ShareButtons({ url, text, labels }: { url: string; text: string; labels: { whatsapp: string; copy: string; copied: string } }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex flex-wrap gap-2">
      <a className="btn btn-sm bg-[#25D366] text-white hover:brightness-95" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.8-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c1.6.7 2.2.7 3 .6a2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .2-1.2c-.1-.1-.2-.2-.5-.3Z" /></svg>
        {labels.whatsapp}
      </a>
      <button
        type="button"
        className="btn-secondary btn-sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {}
        }}
      >
        {copied ? labels.copied : labels.copy}
      </button>
    </div>
  );
}
