import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { Flash } from "@/components/ui";
import { Landing } from "@/components/landing/landing";
import { SITE_NAME, siteUrl } from "@/lib/site";
import "./landing.css";

export const metadata = { alternates: { canonical: "/" } };

/** Durée de chaque scène du carrousel (millisecondes). */
const CAROUSEL_INTERVAL = 7000;

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const ref = /^[A-Za-z0-9]{6,12}$/.test(sp.ref ?? "") ? `?ref=${sp.ref.toUpperCase()}` : "";
  const [players, recruiters, countries, trials] = await Promise.all([
    db.playerProfile.count({ where: { published: true } }),
    db.recruiterProfile.count(),
    db.playerProfile.groupBy({ by: ["country"], where: { published: true } }).then((r) => r.length),
    db.trialEvent.findMany({ where: { startsAt: { gt: new Date() }, recruiter: { suspended: false } }, orderBy: { startsAt: "asc" }, take: 4, select: { id: true, title: true, startsAt: true, city: true, country: true } }),
  ]);
  // Fiche d'identité du site pour Google (nom affiché dans les résultats, logo).
  const base = siteUrl();
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, alternateName: ["Football Talent", "Talent Exchange", "FTE"], url: base, inLanguage: locale },
    { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: base, logo: `${base}/icon-512.png`, description: m.meta.description },
  ];
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      {(sp.ok || sp.erreur) && <div className="mx-auto max-w-6xl px-4 pt-24"><Flash sp={sp} /></div>}
      <Landing m={m} locale={locale} interval={CAROUSEL_INTERVAL} data={{ players, recruiters, countries, trials, refQs: ref }} />
    </>
  );
}
