"use client";

import Script from "next/script";

declare global {
  interface Window { lxInit?: () => void }
}

/** Charge les animations de l'accueil une seule fois, et les relance à chaque retour sur la page. */
export function LandingScript() {
  return <Script src="/landing.js" strategy="afterInteractive" onReady={() => window.lxInit?.()} />;
}
