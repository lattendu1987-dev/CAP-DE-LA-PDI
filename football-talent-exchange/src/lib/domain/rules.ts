// Règles d'accès centralisées (testables sans base de données).
import { DAILY_NEW_CONVERSATIONS } from "./pricing";

export interface SubLike {
  plan: string;
  status: string;
  currentPeriodEnd: Date;
}

export function isSubscriptionActive(sub: SubLike | null | undefined, now: Date = new Date()): boolean {
  if (!sub) return false;
  if (sub.plan === "FREE") return false;
  if (sub.status !== "ACTIVE" && sub.status !== "TRIALING" && sub.status !== "PAST_DUE") return false;
  return sub.currentPeriodEnd.getTime() > now.getTime();
}

export function isPremiumPlayer(sub: SubLike | null | undefined, now: Date = new Date()): boolean {
  return !!sub && sub.plan === "PLAYER_PREMIUM" && isSubscriptionActive(sub, now);
}

export function dailyConversationLimit(sub: SubLike | null | undefined, now: Date = new Date()): number {
  if (!isSubscriptionActive(sub, now)) return 0;
  if (sub!.status === "TRIALING") return DAILY_NEW_CONVERSATIONS.TRIAL;
  return DAILY_NEW_CONVERSATIONS[sub!.plan] ?? 0;
}

export interface ContactCheckInput {
  recruiterSuspended: boolean;
  recruiterVerification: string;
  subscription: SubLike | null;
  newConversationsToday: number;
  playerIsMinor: boolean;
  guardianLinkedAndConsented: boolean;
  blocked: boolean;
  now?: Date;
}

export type ContactReason = "suspended" | "blocked" | "subscription" | "rejected" | "minorVerified" | "minorGuardian" | "dailyLimit";
export type ContactDecision = { ok: true } | { ok: false; reason: ContactReason };

export function canRecruiterContact(i: ContactCheckInput): ContactDecision {
  const now = i.now ?? new Date();
  if (i.recruiterSuspended) return { ok: false, reason: "suspended" };
  if (i.blocked) return { ok: false, reason: "blocked" };
  if (!isSubscriptionActive(i.subscription, now)) return { ok: false, reason: "subscription" };
  if (i.recruiterVerification === "REJECTED") return { ok: false, reason: "rejected" };
  if (i.playerIsMinor) {
    if (i.recruiterVerification !== "VERIFIED") return { ok: false, reason: "minorVerified" };
    if (!i.guardianLinkedAndConsented) return { ok: false, reason: "minorGuardian" };
  }
  if (i.newConversationsToday >= dailyConversationLimit(i.subscription, now)) {
    return { ok: false, reason: "dailyLimit" };
  }
  return { ok: true };
}

const FREE_MAIL = new Set([
  "gmail.com", "yahoo.com", "yahoo.fr", "hotmail.com", "hotmail.fr", "outlook.com", "outlook.fr", "live.com",
  "icloud.com", "aol.com", "proton.me", "protonmail.com", "gmx.com", "mail.com", "orange.fr", "free.fr", "laposte.net",
]);

/** Vérification automatique : courriel professionnel dont le domaine correspond au site du club. */
export function autoVerifyRecruiter(email: string, website: string | null | undefined, type: string): "VERIFIED" | "PENDING" {
  if (type === "AGENT") return "PENDING"; // licence FIFA vérifiée par un humain
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain || FREE_MAIL.has(domain) || !website) return "PENDING";
  let host: string;
  try {
    host = new URL(/^https?:\/\//.test(website) ? website : `https://${website}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "PENDING";
  }
  return domain === host || domain.endsWith(`.${host}`) ? "VERIFIED" : "PENDING";
}
