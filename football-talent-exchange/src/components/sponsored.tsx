import { pickAd } from "@/lib/ads";
import { getMessages } from "@/i18n/server";
import { AdInterstitialDialog } from "./ad-interstitial";

/** Bannière sponsorisée (rien n'est affiché s'il n'y a pas de campagne pour ce visiteur). */
export async function SponsoredBanner({ className = "" }: { className?: string }) {
  const [ad, m] = await Promise.all([pickAd("BANNER"), getMessages()]);
  if (!ad) return null;
  return (
    <aside className={`card relative overflow-hidden p-0 ${className}`} aria-label={m.ads.sponsored} data-testid="ad-banner">
      <a href={ad.clickUrl} target="_blank" rel="sponsored noopener" className="grid items-center gap-0 sm:grid-cols-[minmax(0,240px)_1fr]">
        {ad.mediaType === "video" ? (
          <video src={ad.mediaUrl} muted playsInline loop preload="metadata" className="aspect-video h-full w-full bg-black object-cover" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.mediaUrl} alt="" loading="lazy" decoding="async" className="aspect-video h-full w-full object-cover" />
        )}
        <span className="block p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{m.ads.sponsored} · {ad.advertiser}</span>
          <span className="mt-1 block text-lg font-bold leading-snug text-gray-900" dir="auto">{ad.headline}</span>
          <span className="mt-2 inline-block text-sm font-semibold text-pitch-700">{m.ads.learnMore} ↗</span>
        </span>
      </a>
    </aside>
  );
}

/** Publicité plein écran : au plus une fois par visite, et seulement s'il existe une campagne adaptée. */
export async function SponsoredInterstitial() {
  const [ad, m] = await Promise.all([pickAd("INTERSTITIAL", { count: false }), getMessages()]);
  if (!ad) return null;
  return <AdInterstitialDialog ad={ad} text={{ sponsored: m.ads.sponsored, close: m.ads.close, learnMore: m.ads.learnMore }} />;
}
