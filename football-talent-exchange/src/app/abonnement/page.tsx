import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate, formatUsd } from "@/i18n/format";
import { INTL } from "@/i18n/config";
import { BOOST_OPTIONS, PAID_PLANS, PLAN_INFO, boostCents, priceCents, type PaidPlan } from "@/lib/domain/pricing";
import { MOBILE_MONEY, formatLocal, localAmount, operatorList } from "@/lib/domain/mobile-money";
import { db } from "@/lib/db";
import { demoPaymentsAllowed } from "@/lib/payment-mode";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { stripeEnabled } from "@/lib/stripe";
import { flutterwaveEnabled } from "@/lib/flutterwave";
import { referralBalance } from "@/lib/referral";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { boostAction, checkoutAction, mobileMoneyAction, portalAction } from "@/app/actions/billing";

export async function generateMetadata() {
  return { title: (await getMessages()).billing.metaTitle };
}

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.billing;
  const sub = user.subscription;
  const plans = PAID_PLANS.filter((k) => PLAN_INFO[k].audience === user.role);
  const active = isSubscriptionActive(sub);
  const mm = MOBILE_MONEY[user.country];
  const { available } = await referralBalance(user.id);
  const demo = !stripeEnabled() || (!!mm && !flutterwaveEnabled());
  const profile = user.role === "PLAYER" ? await db.playerProfile.findUnique({ where: { userId: user.id }, select: { boostedUntil: true } }) : null;
  const boostedUntil = profile?.boostedUntil && profile.boostedUntil > new Date() ? profile.boostedUntil : null;
  const local = (cents: number) => (mm ? formatLocal(localAmount(cents, mm.currency), mm.currency, INTL[locale]) : null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t.title}</h1>
        <p className="muted mt-1">{t.intro(countryName(user.country, locale))}</p>
      </div>
      <Flash sp={sp} />
      {demo && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{demoPaymentsAllowed() ? t.demo : t.soon}</div>}
      {available > 0 && <div className="rounded-xl border border-pitch-100 bg-pitch-50 p-3 text-sm text-pitch-900">🎁 {t.creditInfo(formatUsd(available, locale))}</div>}

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">{t.current}</p>
          <p className="text-lg font-bold">
            {sub?.plan && sub.plan !== "FREE" ? t.plans[sub.plan as PaidPlan].name : t.freePlan}{" "}
            {sub && sub.plan !== "FREE" && <Badge tone={active ? "green" : "red"}>{m.labels.subStatus[sub.status]}</Badge>}
          </p>
          {sub && sub.plan !== "FREE" && <p className="muted">{active ? t.until : t.since} {formatDate(sub.currentPeriodEnd, locale)}</p>}
        </div>
        {sub?.stripeSubscriptionId && <form action={portalAction}><button className="btn-secondary">{t.manage}</button></form>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => {
          const month = priceCents(plan, "MONTH", user.country);
          const year = priceCents(plan, "YEAR", user.country);
          return (
            <div key={plan} className="card flex flex-col">
              <h2 className="h2">{t.plans[plan].name}</h2>
              <p className="mt-2 text-3xl font-extrabold">{formatUsd(month, locale)}<span className="text-base font-medium text-gray-500">{t.perMonth}</span></p>
              <p className="muted">{t.orYear(formatUsd(year, locale))}</p>
              {mm && <p className="text-sm text-gray-600">≈ {formatLocal(localAmount(month, mm.currency), mm.currency, INTL[locale])} {t.perMonth}</p>}
              <ul className="my-4 flex-1 space-y-1.5 text-sm">{t.plans[plan].features.map((f) => <li key={f}>✅ {f}</li>)}</ul>

              <p className="mb-2 text-xs font-semibold uppercase text-gray-500">{t.payCard}</p>
              <div className="grid grid-cols-2 gap-2">
                {(["MONTH", "YEAR"] as const).map((interval) => (
                  <form key={interval} action={checkoutAction}>
                    <input type="hidden" name="plan" value={plan} />
                    <input type="hidden" name="interval" value={interval} />
                    <SubmitButton className={interval === "YEAR" ? "btn-primary w-full" : "btn-secondary w-full"} pendingLabel={m.common.wait}>{interval === "YEAR" ? t.yearly : t.monthly}</SubmitButton>
                  </form>
                ))}
              </div>

              {mm && (
                <div className="mt-4 rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase text-amber-900">{t.payMobile}</p>
                  <p className="mb-2 text-xs text-amber-900">{t.mobileInfo(mm.operators)}</p>
                  <ul className="mb-3 flex flex-wrap gap-1.5" aria-label={t.operators}>
                    {operatorList(mm).map((o) => (
                      <li key={o} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${o.startsWith("Airtel") ? "bg-red-600 text-white" : "bg-white text-amber-900 ring-1 ring-amber-200"}`}>{o}</li>
                    ))}
                  </ul>
                  <div className="grid grid-cols-2 gap-2">
                    {(["MONTH", "YEAR"] as const).map((interval) => (
                      <form key={interval} action={mobileMoneyAction}>
                        <input type="hidden" name="plan" value={plan} />
                        <input type="hidden" name="interval" value={interval} />
                        <SubmitButton className="btn w-full bg-amber-400 text-gray-900 hover:bg-amber-500" pendingLabel={m.common.wait}>
                          📱 {formatLocal(localAmount(interval === "YEAR" ? year : month, mm.currency), mm.currency, INTL[locale])}
                        </SubmitButton>
                      </form>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {user.role === "PLAYER" && (
        <section className="card border-amber-300" data-testid="boost">
          <h2 className="h2">{t.boostTitle}</h2>
          <p className="muted mt-1 max-w-2xl">{t.boostText}</p>
          {boostedUntil && <p className="mt-2 text-sm font-semibold text-pitch-700">✅ {t.boostActive(formatDate(boostedUntil, locale))}</p>}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(BOOST_OPTIONS) as (keyof typeof BOOST_OPTIONS)[]).map((option) => {
              const cents = boostCents(option, user.country);
              return (
                <div key={option} className="rounded-xl border border-gray-200 p-4">
                  <p className="font-bold">{option === "WEEK" ? t.boostWeek : t.boostMonth}</p>
                  <p className="text-2xl font-extrabold">{formatUsd(cents, locale)}{local(cents) && <span className="ms-2 text-sm font-medium text-gray-500">≈ {local(cents)}</span>}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <form action={boostAction}>
                      <input type="hidden" name="option" value={option} />
                      <input type="hidden" name="method" value="card" />
                      <SubmitButton className="btn-primary btn-sm" pendingLabel={m.common.wait}>💳 {t.payCard.replace(/^\S+\s/, "")}</SubmitButton>
                    </form>
                    {mm && (
                      <form action={boostAction}>
                        <input type="hidden" name="option" value={option} />
                        <input type="hidden" name="method" value="mobile" />
                        <SubmitButton className="btn btn-sm bg-amber-400 text-gray-900 hover:bg-amber-500" pendingLabel={m.common.wait}>📱 {local(cents)}</SubmitButton>
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
