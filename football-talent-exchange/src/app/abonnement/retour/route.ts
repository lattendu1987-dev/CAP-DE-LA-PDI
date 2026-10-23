import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";
import { completePayment, failPayment } from "@/lib/payments";
import { appUrl } from "@/lib/email";

export const runtime = "nodejs";

// Retour du client après la page de paiement Flutterwave. On vérifie toujours la transaction côté serveur.
export async function GET(req: Request) {
  const m = await getMessages();
  const u = new URL(req.url);
  const go = (key: "ok" | "erreur", msg: string) => NextResponse.redirect(`${appUrl()}/abonnement?${key}=${encodeURIComponent(msg)}`);
  const txRef = u.searchParams.get("tx_ref") ?? "";
  const txId = u.searchParams.get("transaction_id");
  const payment = await db.payment.findUnique({ where: { reference: txRef } });
  if (!payment) return go("erreur", m.billing.flash.paymentFailed);
  if (payment.status === "SUCCEEDED") return go("ok", m.billing.flash.paid);
  if (u.searchParams.get("status") === "cancelled" || !txId) {
    await failPayment(payment.id);
    return go("erreur", m.billing.flash.paymentFailed);
  }
  try {
    const tx = await verifyFlutterwaveTransaction(txId);
    if (tx.tx_ref === payment.reference && tx.status === "successful" && tx.currency === payment.currency && tx.amount >= payment.amountMinor) {
      await completePayment(payment.id);
      return go("ok", m.billing.flash.paid);
    }
    if (tx.status === "failed") {
      await failPayment(payment.id);
      return go("erreur", m.billing.flash.paymentFailed);
    }
  } catch (e) {
    console.error("Vérification Flutterwave impossible", e);
  }
  return go("ok", m.billing.flash.paymentPending);
}
