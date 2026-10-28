import "server-only";
import Stripe from "stripe";

export const stripeEnabled = () => !!process.env.STRIPE_SECRET_KEY;

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquant");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Fin de période, compatible avec les anciennes et nouvelles versions de l'API Stripe. */
export function periodEnd(sub: Stripe.Subscription): Date {
  const anySub = sub as unknown as { current_period_end?: number };
  const ts = sub.items?.data?.[0]?.current_period_end ?? anySub.current_period_end ?? Math.floor(Date.now() / 1000) + 30 * 86400;
  return new Date(ts * 1000);
}

export function mapStatus(s: Stripe.Subscription.Status): "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELED" {
  if (s === "trialing") return "TRIALING";
  if (s === "active") return "ACTIVE";
  if (s === "past_due" || s === "unpaid" || s === "incomplete") return "PAST_DUE";
  return "CANCELED";
}
