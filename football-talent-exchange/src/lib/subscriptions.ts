import "server-only";
import type { BillingInterval, PlanCode, SubscriptionStatus } from "@prisma/client";
import { db } from "./db";

export async function applySubscription(input: {
  userId: string;
  plan: PlanCode;
  interval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodEnd: Date;
  amountCents: number;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}) {
  const data = { ...input, currency: "usd" };
  await db.subscription.upsert({ where: { userId: input.userId }, create: data, update: data });
  // Les joueurs Premium sont mis en avant dans les résultats.
  if (input.plan === "PLAYER_PREMIUM") {
    const active = input.status === "ACTIVE" || input.status === "TRIALING" || input.status === "PAST_DUE";
    await db.playerProfile.updateMany({ where: { userId: input.userId }, data: { featuredUntil: active ? input.currentPeriodEnd : null } });
  }
}
