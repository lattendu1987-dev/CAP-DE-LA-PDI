import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { formatUsd } from "@/i18n/format";
import { AD_FORMATS, type AdFormat } from "@/lib/domain/ads";

export async function generateMetadata() {
  const m = await getMessages();
  return { title: m.ads.metaTitle, description: m.ads.intro };
}

export default async function AdsPage() {
  const [m, locale, user] = await Promise.all([getMessages(), getLocale(), getCurrentUser()]);
  const t = m.ads;
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <h1 className="h1">{t.title}</h1>
        <p className="muted mt-2 text-lg">{t.intro}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {user?.role === "ADVERTISER" ? (
            <Link href="/publicite/campagnes" className="btn-primary">{t.newCampaign}</Link>
          ) : (
            <>
              <Link href="/inscription?role=annonceur" className="btn-primary">{t.createAccount}</Link>
              {!user && <Link href="/connexion" className="btn-secondary">{t.login}</Link>}
            </>
          )}
        </div>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {t.steps.map((s, i) => (
          <li key={s} className="card">
            <p className="text-sm font-bold text-pitch-700">{i + 1}</p>
            <p className="mt-1 font-semibold">{s}</p>
          </li>
        ))}
      </ol>
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(AD_FORMATS) as AdFormat[]).map((f) => (
          <div key={f} className="card">
            <h2 className="h2">{t.formats[f][0]}</h2>
            <p className="muted mt-1">{t.formats[f][1]}</p>
            <p className="mt-3 text-2xl font-extrabold">{t.perDay(formatUsd(AD_FORMATS[f].perDayUsd * 100, locale))}</p>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="h2">{t.rulesTitle}</h2>
        <ul className="mt-2 space-y-1.5 text-sm">{t.rules.map((r) => <li key={r}>✅ {r}</li>)}</ul>
        <p className="muted mt-3 text-sm">{t.priceNote}</p>
      </div>
    </div>
  );
}
