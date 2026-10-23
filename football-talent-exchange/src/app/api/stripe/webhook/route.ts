import type Stripe from "stripe";
import { db } from "@/lib/db";
import { mapStatus, periodEnd, stripe } from "@/lib/stripe";
import { applySubscription } from "@/lib/subscriptions";
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
