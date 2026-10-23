// Règles du parrainage.
export const REFERRAL_RATE = 0.2; // 20 % de chaque paiement
export const REFERRAL_MONTHS = 12; // pendant 12 mois après l'inscription du filleul
export const REFERRAL_HOLD_DAYS = 30; // garantie avant que la commission soit disponible
export const MIN_PAYOUT_CENTS = 2000; // retrait minimum : 20 $

/** Commission (cents USD) due au parrain pour un paiement de son filleul. */
export function commissionFor(paidUsdCents: number, referredSignupAt: Date, paidAt: Date): number {
  if (paidUsdCents <= 0) return 0;
  const limit = new Date(referredSignupAt);
  limit.setUTCMonth(limit.getUTCMonth() + REFERRAL_MONTHS);
  if (paidAt > limit) return 0;
  return Math.floor(paidUsdCents * REFERRAL_RATE);
}

export function availableAtFrom(paidAt: Date): Date {
  return new Date(paidAt.getTime() + REFERRAL_HOLD_DAYS * 86400000);
}

export function normalizeReferralCode(v: string | null | undefined): string | null {
  const c = (v ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{6,12}$/.test(c) ? c : null;
}

export function newReferralCode(rand: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => alphabet[Math.floor(rand() * alphabet.length)]).join("");
}
