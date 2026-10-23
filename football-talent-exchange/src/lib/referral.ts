import "server-only";
import { db } from "./db";
import { availableAtFrom, commissionFor, newReferralCode } from "./domain/referral";
import { messagesFor } from "@/i18n/server";
import { sendEmail, appUrl } from "./email";
import { notifyLater } from "./push";

export async function uniqueReferralCode() {
  for (let i = 0; i < 10; i++) {
    const code = newReferralCode();
    if (!(await db.user.findUnique({ where: { referralCode: code } }))) return code;
  }
  throw new Error("Impossible de générer un code de parrainage");
}

/** Solde du parrain, en cents USD. */
export async function referralBalance(userId: string) {
  const [available, pending, spent] = await Promise.all([
    db.commission.aggregate({ where: { earnerId: userId, status: "AVAILABLE" }, _sum: { amountCents: true } }),
    db.commission.aggregate({ where: { earnerId: userId, status: "PENDING" }, _sum: { amountCents: true } }),
    db.payout.aggregate({ where: { userId, status: { in: ["REQUESTED", "PAID"] } }, _sum: { amountCents: true } }),
  ]);
  const a = available._sum.amountCents ?? 0;
  const s = spent._sum.amountCents ?? 0;
  return { available: Math.max(0, a - s), pending: pending._sum.amountCents ?? 0, totalEarned: a + (pending._sum.amountCents ?? 0) };
}

/** Crée automatiquement la commission du parrain quand un filleul paie. Idempotent. */
export async function rewardReferrer(input: { payerId: string; usdCents: number; paidAt: Date; paymentId?: string; externalRef?: string }) {
  const payer = await db.user.findUnique({ where: { id: input.payerId }, include: { referredBy: true } });
  const referrer = payer?.referredBy;
  if (!payer || !referrer || referrer.suspended || referrer.id === payer.id) return null;
  const amount = commissionFor(input.usdCents, payer.createdAt, input.paidAt);
  if (amount <= 0) return null;
  if (input.paymentId && (await db.commission.findUnique({ where: { paymentId: input.paymentId } }))) return null;
  if (input.externalRef && (await db.commission.findUnique({ where: { externalRef: input.externalRef } }))) return null;
  const c = await db.commission.create({
    data: {
      earnerId: referrer.id, sourceId: payer.id, amountCents: amount, paymentId: input.paymentId ?? null, externalRef: input.externalRef ?? null,
      availableAt: availableAtFrom(input.paidAt),
    },
  });
  const m = messagesFor(referrer.locale);
  await sendEmail(referrer.email, m.email.commissionSubject, m.email.commissionBody((amount / 100).toFixed(2), `${appUrl()}/parrainage`));
  notifyLater(referrer.id, (pm) => ({ title: pm.push.commissionTitle, body: pm.push.commissionBody(`${(amount / 100).toFixed(2)} $`), url: "/parrainage", tag: "commission" }));
  return c;
}

export async function releaseCommissions(now = new Date()) {
  const { count } = await db.commission.updateMany({ where: { status: "PENDING", availableAt: { lte: now } }, data: { status: "AVAILABLE" } });
  return count;
}
