"use server";
import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { PLAN_INFO, priceCents, type Interval, type PaidPlan } from "@/lib/domain/pricing";
import { MOBILE_MONEY, localAmount } from "@/lib/domain/mobile-money";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { createFlutterwavePayment, flutterwaveEnabled } from "@/lib/flutterwave";
import { completePayment } from "@/lib/payments";
import { referralBalance } from "@/lib/referral";
import { appUrl } from "@/lib/email";

const back = (msg: string, err = false): never => redirect(`/abonnement?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

async function prepare(fd: FormData) {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const m = await getMessages();
  const plan = String(fd.get("plan")) as PaidPlan;
  const interval: Interval = fd.get("interval") === "YEAR" ? "YEAR" : "MONTH";
  if (!PLAN_INFO[plan] || PLAN_INFO[plan].audience !== user.role) back(m.billing.flash.notAvailable, true);
  return { user, m, plan, interval, usdCents: priceCents(plan, interval, user.country) };
}

/** Paiement par carte (Stripe, renouvellement automatique). */
export async function checkoutAction(fd: FormData) {
  const { user, m, plan, interval, usdCents } = await prepare(fd);
  const planName = m.billing.plans[plan].name;

  if (!stripeEnabled()) {
    // Mode démo : paiement simulé, qui déclenche aussi le parrainage.
    const { available } = await referralBalance(user.id);
    const payment = await db.payment.create({
      data: { userId: user.id, provider: "demo", reference: `demo_${randomBytes(8).toString("hex")}`, plan, interval, amountMinor: usdCents, currency: "USD", usdCents, creditUsedCents: Math.min(available, usdCents) },
    });
    await completePayment(payment.id);
    back(m.billing.flash.demoActivated(planName));
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
  // Le solde de parrainage devient un crédit Stripe, appliqué automatiquement aux factures.
  const { available } = await referralBalance(user.id);
  const credit = Math.min(available, usdCents);
  if (credit > 0) {
    await s.customers.createBalanceTransaction(customerId, { amount: -credit, currency: "usd", description: "Referral credit" });
    await db.payout.create({ data: { userId: user.id, amountCents: credit, method: "CREDIT", status: "PAID", processedAt: new Date() } });
  }
  const session = await s.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{
      quantity: 1,
      price_data: { currency: "usd", unit_amount: usdCents, recurring: { interval: interval === "YEAR" ? "year" : "month" }, product_data: { name: `Football Talent Exchange — ${planName}` } },
    }],
    metadata: { userId: user.id, plan, interval },
    subscription_data: { metadata: { userId: user.id, plan, interval } },
    allow_promotion_codes: true,
    success_url: `${appUrl()}/abonnement?ok=${encodeURIComponent(m.billing.flash.paid)}`,
    cancel_url: `${appUrl()}/abonnement`,
  });
  redirect(session.url!);
}

/** Paiement par mobile money (Flutterwave) : période prépayée, sans prélèvement automatique. */
export async function mobileMoneyAction(fd: FormData) {
  const { user, m, plan, interval, usdCents } = await prepare(fd);
  const mm = MOBILE_MONEY[user.country];
  if (!mm) back(m.billing.flash.mobileUnavailable, true);
  const { available } = await referralBalance(user.id);
  const credit = Math.min(available, usdCents);
  const due = usdCents - credit;
  const reference = `fte_${randomBytes(10).toString("hex")}`;
  const amountMinor = due > 0 ? localAmount(due, mm!.currency) : 0;
  const payment = await db.payment.create({
    data: { userId: user.id, provider: due > 0 && flutterwaveEnabled() ? "flutterwave" : due > 0 ? "demo" : "credit", reference, plan, interval, amountMinor, currency: mm!.currency, usdCents, creditUsedCents: credit },
  });

  if (due <= 0) {
    await completePayment(payment.id);
    back(m.billing.flash.paidWithCredit);
  }
  if (!flutterwaveEnabled()) {
    await completePayment(payment.id);
    back(m.billing.flash.demoActivated(m.billing.plans[plan].name));
  }
  const link = await createFlutterwavePayment({
    txRef: reference,
    amount: amountMinor,
    currency: mm!.currency,
    paymentOptions: mm!.option,
    redirectUrl: `${appUrl()}/abonnement/retour`,
    email: user.email,
    name: user.name,
    title: `Football Talent Exchange — ${m.billing.plans[plan].name}`,
  });
  redirect(link);
}

export async function portalAction() {
  const user = await requireUser(["PLAYER", "RECRUITER"]);
  const m = await getMessages();
  const customer = user.subscription?.stripeCustomerId;
  if (!stripeEnabled() || !customer || !user.subscription?.stripeSubscriptionId) back(m.billing.flash.nothingToManage, true);
  const portal = await stripe().billingPortal.sessions.create({ customer: customer!, return_url: `${appUrl()}/abonnement` });
  redirect(portal.url);
}
