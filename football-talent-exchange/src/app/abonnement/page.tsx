import { requireUser } from "@/lib/auth";
import { PLAN_INFO, formatUsd, priceCents, type PaidPlan } from "@/lib/domain/pricing";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { countryName } from "@/lib/domain/reference";
import { stripeEnabled } from "@/lib/stripe";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { checkoutAction, portalAction } from "@/app/actions/billing";

export const metadata = { title: "Abonnement" };

const STATUS: Record<string, string> = { TRIALING: "Essai gratuit", ACTIVE: "Actif", PAST_DUE: "Paiement en retard", CANCELED: "Terminé" };

export default async function BillingPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const sp = await searchParams;
  const sub = user.subscription;
  const plans = (Object.keys(PLAN_INFO) as PaidPlan[]).filter((k) => PLAN_INFO[k].audience === user.role);
  const active = isSubscriptionActive(sub);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="h1">Abonnement</h1>
        <p className="muted mt-1">Prix adaptés à ton pays ({countryName(user.country)}). Sans engagement, annulable à tout moment.</p>
      </div>
      <Flash sp={sp} />
      {!stripeEnabled() && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Mode démo : aucun paiement réel n&apos;est demandé (clé Stripe non configurée).</div>}

      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">Offre actuelle</p>
          <p className="text-lg font-bold">
            {sub?.plan && sub.plan !== "FREE" ? PLAN_INFO[sub.plan as PaidPlan].name : "Gratuit"}{" "}
            {sub && sub.plan !== "FREE" && <Badge tone={active ? "green" : "red"}>{STATUS[sub.status]}</Badge>}
          </p>
          {sub && sub.plan !== "FREE" && <p className="muted">{active ? "Jusqu'au" : "Depuis le"} {sub.currentPeriodEnd.toLocaleDateString("fr-CA")}</p>}
        </div>
        {sub?.stripeSubscriptionId && <form action={portalAction}><button className="btn-secondary">Gérer le paiement / annuler</button></form>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div key={plan} className="card flex flex-col">
            <h2 className="h2">{PLAN_INFO[plan].name}</h2>
            <p className="mt-2 text-3xl font-extrabold">{formatUsd(priceCents(plan, "MONTH", user.country))}<span className="text-base font-medium text-gray-500"> / mois</span></p>
            <p className="muted">ou {formatUsd(priceCents(plan, "YEAR", user.country))} / an (2 mois offerts)</p>
            <ul className="my-4 flex-1 space-y-1.5 text-sm">{PLAN_INFO[plan].features.map((f) => <li key={f}>✅ {f}</li>)}</ul>
            <div className="grid grid-cols-2 gap-2">
              {(["MONTH", "YEAR"] as const).map((interval) => (
                <form key={interval} action={checkoutAction}>
                  <input type="hidden" name="plan" value={plan} />
                  <input type="hidden" name="interval" value={interval} />
                  <SubmitButton className={interval === "YEAR" ? "btn-primary w-full" : "btn-secondary w-full"}>{interval === "YEAR" ? "Annuel" : "Mensuel"}</SubmitButton>
                </form>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
