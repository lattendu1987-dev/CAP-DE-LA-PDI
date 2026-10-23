import { timingSafeEqual } from "node:crypto";
import { db } from "@/lib/db";
import { verifyFlutterwaveTransaction } from "@/lib/flutterwave";
import { completePayment, failPayment } from "@/lib/payments";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

// Notification Flutterwave (le paiement mobile money peut être confirmé après le retour du client).
export async function POST(req: Request) {
  const expected = process.env.FLW_WEBHOOK_HASH;
  const given = req.headers.get("verif-hash") ?? "";
  if (!expected || given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) {
    return new Response("Non autorisé", { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { data?: { id?: number; tx_ref?: string } } | null;
  const id = body?.data?.id;
  const txRef = body?.data?.tx_ref;
  if (!id || !txRef) return Response.json({ ignored: true });
  const payment = await db.payment.findUnique({ where: { reference: txRef } });
  if (!payment || payment.status !== "PENDING") return Response.json({ ok: true });
  const tx = await verifyFlutterwaveTransaction(id);
  if (tx.tx_ref === payment.reference && tx.status === "successful" && tx.currency === payment.currency && tx.amount >= payment.amountMinor) {
    await completePayment(payment.id);
  } else if (tx.status === "failed") {
    await failPayment(payment.id);
  }
  await audit(null, "flutterwave.webhook", { txRef, status: tx.status });
  return Response.json({ ok: true });
}
