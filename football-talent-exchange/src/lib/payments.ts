import "server-only";
import type { BillingInterval, PlanCode } from "@prisma/client";
import { db } from "./db";
import { applySubscription } from "./subscriptions";
import { referralBalance, rewardReferrer } from "./referral";
import { audit } from "./audit";

/** Nouvelle fin de période : on prolonge la période en cours si elle est encore active. */
export function extendPeriod(currentEnd: Date | null | undefined, interval: BillingInterval, now = new Date()) {
  const start = currentEnd && currentEnd > now ? currentEnd : now;
  const end = new Date(start);
  if (interval === "YEAR") end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

/** Valide un paiement (mobile money, solde de parrainage ou démo) et active l'abonnement. Idempotent. */
export async function completePayment(paymentId: string) {
  const updated = await db.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "SUCCEEDED", paidAt: new Date() } });
  if (updated.count === 0) return false;
  const p = await db.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { user: { include: { subscription: true } } } });
  const sub = p.user.subscription;
  const samePlan = sub && sub.plan === p.plan && sub.status !== "CANCELED";
  await applySubscription({
    userId: p.userId,
    plan: p.plan as PlanCode,
    interval: p.interval,
    status: "ACTIVE",
    currentPeriodEnd: extendPeriod(samePlan ? sub.currentPeriodEnd : null, p.interval),
    amountCents: p.usdCents,
    stripeCustomerId: sub?.stripeCustomerId ?? null,
    stripeSubscriptionId: null,
  });
  if (p.creditUsedCents > 0) {
    const { available } = await referralBalance(p.userId);
    const used = Math.min(available, p.creditUsedCents);
    if (used > 0) await db.payout.create({ data: { userId: p.userId, amountCents: used, method: "CREDIT", status: "PAID", processedAt: new Date() } });
  }
  // La part réellement payée en argent ouvre droit à commission.
  const cashUsd = p.usdCents - p.creditUsedCents;
  if (cashUsd > 0) await rewardReferrer({ payerId: p.userId, usdCents: cashUsd, paidAt: new Date(), paymentId: p.id });
  await audit(p.userId, "payment.succeeded", { provider: p.provider, plan: p.plan, usdCents: p.usdCents });
  return true;
}

export async function failPayment(paymentId: string) {
  await db.payment.updateMany({ where: { id: paymentId, status: "PENDING" }, data: { status: "FAILED" } });
}
