import Link from "next/link";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatUsd } from "@/i18n/format";
import { INTL } from "@/i18n/config";
import { AFRICA, BOOST_OPTIONS, PAID_PLANS, PLAN_INFO, boostCents, discountPercent, priceCents, TRIAL_DAYS } from "@/lib/domain/pricing";
import { MOBILE_MONEY, formatLocal, localAmount } from "@/lib/domain/mobile-money";
import { COUNTRY_CODES } from "@/lib/domain/reference";
import { visitorCountry } from "@/lib/geo";
import { CountrySelect } from "@/components/country-select";

export async function generateMetadata() {
  return { title: (await getMessages()).pricing.metaTitle };
}

export default async function PricingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m, locale, detected] = await Promise.all([searchParams, getMessages(), getLocale(), visitorCountry()]);
  const t = m.pricing;
  // Pays choisi dans la page, sinon pays détecté d'après l'adresse IP, sinon prix de référence.
  const asked = (sp.pays ?? "").toUpperCase();
  const country = COUNTRY_CODES.includes(asked) ? asked : (detected ?? "CA");
  const mm = MOBILE_MONEY[country];
  const local = (cents: number) => (mm ? formatLocal(localAmount(cents, mm.currency), mm.currency, INTL[locale]) : null);
  const off = discountPercent(country);
  const boostFrom = Math.min(...(Object.keys(BOOST_OPTIONS) as (keyof typeof BOOST_OPTIONS)[]).map((o) => boostCents(o, country)));

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="h1">{t.title}</h1>
        <p className="muted mx-auto mt-2 max-w-2xl">{t.intro}</p>
      </div>

      <form method="get" className="card mx-auto flex max-w-2xl flex-wrap items-end gap-3" data-testid="pricing-country">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold">{t.pricesFor(countryName(country, locale))}</p>
          {off > 0 && <p className="text-sm font-semibold text-pitch-700">{t.discount(off)}</p>}
          <label className="mt-2 block text-xs text-gray-500" htmlFor="pays">{t.detected}</label>
          <CountrySelect name="pays" id="pays" locale={locale} defaultValue={country} />
        </div>
        <button className="btn-secondary">{t.show}</button>
      </form>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <h2 className="h2">{t.freeName}</h2>
          <p className="mt-2 text-3xl font-extrabold">{formatUsd(0, locale)}</p>
          <ul className="mt-4 space-y-1.5 text-sm">{t.freeFeatures.map((f) => <li key={f}>✅ {f}</li>)}</ul>
          <Link href="/inscription?role=joueur" className="btn-secondary mt-5 w-full">{t.start}</Link>
        </div>
        {PAID_PLANS.map((p) => {
          const cents = priceCents(p, "MONTH", country);
          return (
            <div key={p} className={`card ${p === "RECRUITER_PRO" ? "ring-2 ring-pitch-500" : ""}`}>
              <h2 className="h2">{m.billing.plans[p].name}</h2>
              <p className="mt-2 text-3xl font-extrabold" data-testid={`price-${p}`}>{formatUsd(cents, locale)}<span className="text-sm font-medium text-gray-500">{t.perMonth}</span></p>
              {local(cents) && <p className="text-sm text-gray-600" data-testid={`local-${p}`}>{t.approx} {local(cents)}{t.perMonth}</p>}
              <ul className="mt-4 space-y-1.5 text-sm">{m.billing.plans[p].features.map((f) => <li key={f}>✅ {f}</li>)}</ul>
              <Link href={`/inscription?role=${PLAN_INFO[p].audience === "PLAYER" ? "joueur" : "recruteur"}`} className="btn-primary mt-5 w-full">
                {PLAN_INFO[p].audience === "RECRUITER" ? t.trial(TRIAL_DAYS) : t.choose}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">🚀 {t.boostTitle}</h2>
          <p className="muted mt-1">{t.boostText}</p>
          <p className="mt-2 font-bold">{t.boostFrom(formatUsd(boostFrom, locale))}{local(boostFrom) && <span className="ms-1 font-medium text-gray-500">(≈ {local(boostFrom)})</span>}</p>
        </div>
        <div className="card">
          <h2 className="h2">{t.payTitle}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            <li>💳 {t.payCards}</li>
            <li>📱 {mm ? t.payMobile(mm.operators) : t.payMobileNone}</li>
          </ul>
          {AFRICA.has(country) && <p className="mt-3 text-sm font-semibold text-pitch-700">{t.africaMin}</p>}
        </div>
      </div>
      <p className="muted text-center">{t.noCommission}</p>
    </div>
  );
}
