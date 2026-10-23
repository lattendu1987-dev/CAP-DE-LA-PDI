import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate, formatUsd } from "@/i18n/format";
import { INTL } from "@/i18n/config";
import { PAID_PLANS, PLAN_INFO, priceCents, type PaidPlan } from "@/lib/domain/pricing";
import { MOBILE_MONEY, formatLocal, localAmount } from "@/lib/domain/mobile-money";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { stripeEnabled } from "@/lib/stripe";
import { flutterwaveEnabled } from "@/lib/flutterwave";
import { referralBalance } from "@/lib/referral";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { checkoutAction, mobileMoneyAction, portalAction } from "@/app/actions/billing";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">{t.title}</h1>
        <p className="muted mt-1">{t.intro(countryName(user.country, locale))}</p>
      </div>
      <Flash sp={sp} />
      {demo && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{t.demo}</div>}
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
    </div>
  );
}
