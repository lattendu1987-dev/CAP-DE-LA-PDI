import type Stripe from "stripe";
import { db } from "@/lib/db";
import { mapStatus, periodEnd, stripe } from "@/lib/stripe";
import { applySubscription } from "@/lib/subscriptions";
import { rewardReferrer } from "@/lib/referral";
import { audit } from "@/lib/audit";
import type { PlanCode } from "@prisma/client";

export const runtime = "nodejs";

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  const plan = sub.metadata?.plan as PlanCode | undefined;
  if (!userId || !plan) return;
  if (!(await db.user.findUnique({ where: { id: userId } }))) return;
  const item = sub.items.data[0];
  await applySubscription({
    userId,
    plan,
    interval: sub.metadata?.interval === "YEAR" ? "YEAR" : "MONTH",
    status: mapStatus(sub.status),
    currentPeriodEnd: periodEnd(sub),
    amountCents: item?.price?.unit_amount ?? 0,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
  });
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  if (!secret || !sig) return new Response("Webhook non configuré", { status: 400 });
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), sig, secret);
  } catch {
    return new Response("Signature invalide", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.subscription) {
        const id = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        await syncSubscription(await stripe().subscriptions.retrieve(id));
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await syncSubscription(event.data.object);
      break;
    case "invoice.paid": {
      // Chaque facture payée (première et renouvellements) rapporte une commission au parrain.
      const inv = event.data.object;
      const customerId = typeof inv.customer === "string" ? inv.customer : inv.customer?.id;
      const sub = customerId ? await db.subscription.findFirst({ where: { stripeCustomerId: customerId } }) : null;
      // L'offre est lue dans la facture : elle peut arriver avant la mise à jour de l'abonnement.
      const raw = inv as unknown as { parent?: { subscription_details?: { metadata?: Record<string, string> } }; subscription_details?: { metadata?: Record<string, string> } };
      const meta = raw.parent?.subscription_details?.metadata ?? raw.subscription_details?.metadata ?? {};
      const plan = (meta.plan as PlanCode | undefined) ?? sub?.plan;
      if (sub && plan && inv.amount_paid > 0 && inv.id) {
        if (!(await db.payment.findUnique({ where: { reference: inv.id } }))) {
          await db.payment.create({
            data: { userId: sub.userId, provider: "stripe", reference: inv.id, plan, interval: meta.interval === "YEAR" ? "YEAR" : sub.interval, amountMinor: inv.amount_paid, currency: inv.currency.toUpperCase(), usdCents: inv.amount_paid, status: "SUCCEEDED", paidAt: new Date() },
          });
        }
        await rewardReferrer({ payerId: sub.userId, usdCents: inv.amount_paid, paidAt: new Date(), externalRef: inv.id });
      }
      break;
    }
    case "invoice.payment_failed": {
      const customer = event.data.object.customer;
      const customerId = typeof customer === "string" ? customer : customer?.id;
      if (customerId) await db.subscription.updateMany({ where: { stripeCustomerId: customerId }, data: { status: "PAST_DUE" } });
      break;
    }
  }
  await audit(null, `stripe.${event.type}`, { id: event.id });
  return Response.json({ received: true });
}
