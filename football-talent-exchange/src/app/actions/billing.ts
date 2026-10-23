"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLAN_INFO, priceCents, type Interval, type PaidPlan } from "@/lib/domain/pricing";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { applySubscription } from "@/lib/subscriptions";
import { appUrl } from "@/lib/email";
import { audit } from "@/lib/audit";

export async function checkoutAction(fd: FormData) {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const plan = String(fd.get("plan")) as PaidPlan;
  const interval: Interval = fd.get("interval") === "YEAR" ? "YEAR" : "MONTH";
  const info = PLAN_INFO[plan];
  if (!info || info.audience !== user.role) redirect("/abonnement?erreur=" + encodeURIComponent("Offre non disponible pour ce type de compte."));
  const amount = priceCents(plan, interval, user.country);

  if (!stripeEnabled()) {
    // Mode démo : activation immédiate sans paiement (à n'utiliser qu'en test).
    const end = new Date(Date.now() + (interval === "YEAR" ? 365 : 30) * 86400000);
    await applySubscription({ userId: user.id, plan, interval, status: "ACTIVE", currentPeriodEnd: end, amountCents: amount });
    await audit(user.id, "subscription.demo", { plan, interval });
    redirect("/abonnement?ok=" + encodeURIComponent(`Mode démo : abonnement ${info.name} activé sans paiement.`));
  }

  const s = stripe();
  let customerId = user.subscription?.stripeCustomerId ?? null;
  if (!customerId) {
    customerId = (await s.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } })).id;
    await db.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: "FREE", status: "ACTIVE", currentPeriodEnd: new Date("2999-12-31"), stripeCustomerId: customerId },
      update: { stripeCustomerId: customerId },
    });
  }
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{
      quantity: 1,
      price_data: { currency: "usd", unit_amount: amount, recurring: { interval: interval === "YEAR" ? "year" : "month" }, product_data: { name: `Football Talent Exchange — ${info.name}` } },
    }],
    metadata: { userId: user.id, plan, interval },
    subscription_data: { metadata: { userId: user.id, plan, interval } },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/abonnement?ok=${encodeURIComponent("Paiement reçu, merci ! Ton abonnement est actif.")}`,
    cancel_url: `${appUrl()}/abonnement`,
  });
  redirect(session.url!);
}

export async function portalAction() {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const customer = user.subscription?.stripeCustomerId;
  if (!stripeEnabled() || !customer) redirect("/abonnement?erreur=" + encodeURIComponent("Aucun abonnement payant à gérer."));
  const portal = await stripe().billingPortal.sessions.create({ customer: customer!, return_url: `${appUrl()}/abonnement` });
  redirect(portal.url);
}
