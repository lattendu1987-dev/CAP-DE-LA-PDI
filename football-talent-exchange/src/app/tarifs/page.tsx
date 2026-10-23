import Link from "next/link";
import { getLocale, getMessages } from "@/i18n/server";
import { formatUsd } from "@/i18n/format";
import { PAID_PLANS, PLAN_INFO, priceCents, TRIAL_DAYS } from "@/lib/domain/pricing";

export async function generateMetadata() {
  return { title: (await getMessages()).pricing.metaTitle };
}

export default async function PricingPage() {
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.pricing;
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="h1">{t.title}</h1>
        <p className="muted mx-auto mt-2 max-w-2xl">{t.intro}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <h2 className="h2">{t.freeName}</h2>
          <p className="mt-2 text-3xl font-extrabold">{formatUsd(0, locale)}</p>
          <ul className="mt-4 space-y-1.5 text-sm">{t.freeFeatures.map((f) => <li key={f}>✅ {f}</li>)}</ul>
          <Link href="/inscription?role=joueur" className="btn-secondary mt-5 w-full">{t.start}</Link>
        </div>
        {PAID_PLANS.map((p) => (
          <div key={p} className={`card ${p === "RECRUITER_PRO" ? "ring-2 ring-pitch-500" : ""}`}>
            <h2 className="h2">{m.billing.plans[p].name}</h2>
            <p className="mt-2 text-3xl font-extrabold">{formatUsd(priceCents(p, "MONTH", "CA"), locale)}<span className="text-sm font-medium text-gray-500">{t.perMonth}</span></p>
            <ul className="mt-4 space-y-1.5 text-sm">{m.billing.plans[p].features.map((f) => <li key={f}>✅ {f}</li>)}</ul>
            <Link href={`/inscription?role=${PLAN_INFO[p].audience === "PLAYER" ? "joueur" : "recruteur"}`} className="btn-primary mt-5 w-full">
              {PLAN_INFO[p].audience === "RECRUITER" ? t.trial(TRIAL_DAYS) : t.choose}
            </Link>
          </div>
        ))}
      </div>
      <p className="muted text-center">{t.noCommission}</p>
    </div>
  );
}
