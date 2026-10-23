import Link from "next/link";
import { PLAN_INFO, formatUsd, priceCents, type PaidPlan, TRIAL_DAYS } from "@/lib/domain/pricing";

export const metadata = { title: "Tarifs" };

export default function PricingPage() {
  const plans = Object.keys(PLAN_INFO) as PaidPlan[];
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="h1">Tarifs simples, adaptés à ton pays</h1>
        <p className="muted mt-2">Prix de référence (Canada, Europe, États-Unis). Jusqu&apos;à 65 % moins cher en Afrique, en Amérique latine et ailleurs, selon le pouvoir d&apos;achat.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card">
          <h2 className="h2">Joueur Gratuit</h2>
          <p className="mt-2 text-3xl font-extrabold">0 $</p>
          <ul className="mt-4 space-y-1.5 text-sm"><li>✅ Profil complet</li><li>✅ 1 vidéo</li><li>✅ Messagerie</li><li>✅ Fiche PDF</li></ul>
          <Link href="/inscription?role=joueur" className="btn-secondary mt-5 w-full">Commencer</Link>
        </div>
        {plans.map((p) => (
          <div key={p} className={`card ${p === "RECRUITER_PRO" ? "ring-2 ring-pitch-500" : ""}`}>
            <h2 className="h2">{PLAN_INFO[p].name}</h2>
            <p className="mt-2 text-3xl font-extrabold">{formatUsd(priceCents(p, "MONTH", "CA"))}<span className="text-sm font-medium text-gray-500">/mois</span></p>
            <ul className="mt-4 space-y-1.5 text-sm">{PLAN_INFO[p].features.map((f) => <li key={f}>✅ {f}</li>)}</ul>
            <Link href={`/inscription?role=${PLAN_INFO[p].audience === "PLAYER" ? "joueur" : "recruteur"}`} className="btn-primary mt-5 w-full">
              {PLAN_INFO[p].audience === "RECRUITER" ? `Essai gratuit ${TRIAL_DAYS} jours` : "Choisir"}
            </Link>
          </div>
        ))}
      </div>
      <p className="muted text-center">Aucune commission sur les transferts ou les contrats. Football Talent Exchange n&apos;est pas un agent.</p>
    </div>
  );
}
