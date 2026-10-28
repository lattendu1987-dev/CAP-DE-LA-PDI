import "server-only";
import { appUrl } from "./email";

const API = "https://api.flutterwave.com/v3";
export const flutterwaveEnabled = () => !!process.env.FLW_SECRET_KEY;

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const json = (await res.json()) as T & { status?: string; message?: string };
  if (!res.ok) throw new Error(`Flutterwave ${res.status}: ${json.message ?? "erreur"}`);
  return json;
}

/** Crée une page de paiement hébergée par Flutterwave et renvoie son lien. */
export async function createFlutterwavePayment(p: {
  txRef: string;
  amount: number;
  currency: string;
  paymentOptions: string;
  redirectUrl: string;
  email: string;
  name: string;
  title: string;
}) {
  const r = await call<{ data: { link: string } }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: p.txRef,
      amount: p.amount,
      currency: p.currency,
      payment_options: p.paymentOptions,
      redirect_url: p.redirectUrl,
      customer: { email: p.email, name: p.name },
      customizations: { title: p.title, logo: `${appUrl()}/icon-192.png` },
    }),
  });
  return r.data.link;
}

export interface FlwTransaction {
  id: number;
  tx_ref: string;
  status: string;
  amount: number;
  currency: string;
}

/** Vérifie une transaction directement auprès de Flutterwave (ne jamais se fier au navigateur). */
export async function verifyFlutterwaveTransaction(id: string | number): Promise<FlwTransaction> {
  const r = await call<{ data: FlwTransaction }>(`/transactions/${encodeURIComponent(String(id))}/verify`);
  return r.data;
}
