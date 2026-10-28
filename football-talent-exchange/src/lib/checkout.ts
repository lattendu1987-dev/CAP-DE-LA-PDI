import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { MOBILE_MONEY, localAmount } from "./domain/mobile-money";
import { stripe, stripeEnabled } from "./stripe";
import { createFlutterwavePayment, flutterwaveEnabled } from "./flutterwave";
import { completePayment } from "./payments";
import { appUrl } from "./email";
import { demoPaymentsAllowed } from "./payment-mode";

/**
 * Achat unique (Boost de visibilité, publicité) par carte (Stripe) ou mobile money (Flutterwave).
 * Sans clés de paiement configurées : paiement simulé (mode démo), validé immédiatement.
 */
export async function startOneOffPayment(opts: {
  user: { id: string; email: string; name: string; country: string };
  purpose: "BOOST" | "AD";
  usdCents: number;
  method: "card" | "mobile";
  title: string;
  returnPath: string;
  boostDays?: number;
  adCampaignId?: string;
}): Promise<{ redirectTo: string } | { completed: true } | { unavailable: true }> {
  const { user, purpose, usdCents, method, title, returnPath } = opts;
  const reference = `fte_${purpose.toLowerCase()}_${randomBytes(10).toString("hex")}`;
  const mm = method === "mobile" ? MOBILE_MONEY[user.country] : undefined;
  const live = method === "mobile" ? !!mm && flutterwaveEnabled() : stripeEnabled();
  if (!live && !demoPaymentsAllowed()) return { unavailable: true };
  const payment = await db.payment.create({
    data: {
      userId: user.id, provider: live ? (method === "mobile" ? "flutterwave" : "stripe") : "demo", reference, purpose,
      boostDays: opts.boostDays, adCampaignId: opts.adCampaignId,
      amountMinor: mm ? localAmount(usdCents, mm.currency) : usdCents, currency: mm ? mm.currency : "USD", usdCents,
    },
  });
  if (!live) {
    await completePayment(payment.id);
    return { completed: true };
  }
  if (method === "mobile") {
    const link = await createFlutterwavePayment({
      txRef: reference, amount: payment.amountMinor, currency: mm!.currency, paymentOptions: mm!.option,
      redirectUrl: `${appUrl()}/abonnement/retour`, email: user.email, name: user.name, title,
    });
    return { redirectTo: link };
  }
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: user.id,
    line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: usdCents, product_data: { name: title } } }],
    metadata: { paymentId: payment.id, userId: user.id, purpose },
    payment_intent_data: { metadata: { paymentId: payment.id } },
    success_url: `${appUrl()}${returnPath}${returnPath.includes("?") ? "&" : "?"}paye=1`,
    cancel_url: `${appUrl()}${returnPath}`,
  });
  return { redirectTo: session.url! };
}

