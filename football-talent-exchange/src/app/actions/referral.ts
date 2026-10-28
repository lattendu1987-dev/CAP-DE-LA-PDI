"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { formatUsd } from "@/i18n/format";
import { referralBalance } from "@/lib/referral";
import { MIN_PAYOUT_CENTS } from "@/lib/domain/referral";
import { isMinor } from "@/lib/domain/age";
import { audit } from "@/lib/audit";

const go = (msg: string, err = false): never => redirect(`/parrainage?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

export async function requestPayoutAction(fd: FormData) {
  const user = await requireUser();
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.referral.flash;
  if (user.player && isMinor(user.player.birthDate)) go(t.minor, true);
  const r = z
    .object({
      method: z.enum(["MOBILE_MONEY", "PAYPAL", "BANK"]),
      destination: z.string().trim().min(5).max(120),
      amount: z.coerce.number().positive().max(100000),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) go(r.error!.issues.some((i) => i.path[0] === "destination") ? t.destination : t.tooLow(formatUsd(MIN_PAYOUT_CENTS, locale)), true);
  const cents = Math.round(r.data!.amount * 100);
  if (cents < MIN_PAYOUT_CENTS) go(t.tooLow(formatUsd(MIN_PAYOUT_CENTS, locale)), true);
  const { available } = await referralBalance(user.id);
  if (cents > available) go(t.tooHigh, true);
  await db.payout.create({ data: { userId: user.id, amountCents: cents, method: r.data!.method, destination: r.data!.destination } });
  await audit(user.id, "payout.request", { cents, method: r.data!.method });
  go(t.requested);
}
