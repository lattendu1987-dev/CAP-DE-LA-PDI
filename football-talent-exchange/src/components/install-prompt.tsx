"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** Enregistre le service worker et propose d'installer l'application sur le téléphone. */
export function InstallPrompt({ text }: { text: { title: string; text: string; button: string; ios: string; dismiss: string } }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    let dismissed = false;
    try {
      dismissed = localStorage.getItem("fte_install_dismissed") === "1";
    } catch {}
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    if (dismissed || standalone) return;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
    if (isIos) {
      setIos(true);
      setHidden(false);
    }
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  if (hidden) return null;
  const close = () => {
    setHidden(true);
    try {
      localStorage.setItem("fte_install_dismissed", "1");
    } catch {}
  };
  return (
    <div className="no-print fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-pitch-600 text-xl text-white">⚽</span>
        <div className="flex-1">
          <p className="font-bold">{text.title}</p>
          <p className="text-sm text-gray-600">{ios ? text.ios : text.text}</p>
          <div className="mt-3 flex gap-2">
            {evt && (
              <button className="btn-primary btn-sm" onClick={async () => { await evt.prompt(); close(); }}>{text.button}</button>
            )}
            <button className="btn-secondary btn-sm" onClick={close}>{text.dismiss}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
