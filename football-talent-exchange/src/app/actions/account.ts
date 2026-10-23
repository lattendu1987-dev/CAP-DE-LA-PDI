"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { audit } from "@/lib/audit";

export async function changePasswordAction(fd: FormData) {
  const user = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) redirect("/compte?erreur=" + encodeURIComponent("Mot de passe actuel incorrect."));
  if (next.length < 8) redirect("/compte?erreur=" + encodeURIComponent("Le nouveau mot de passe doit contenir au moins 8 caractères."));
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  redirect("/compte?ok=" + encodeURIComponent("Mot de passe modifié."));
}

export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser();
  if (fd.get("confirm") !== "SUPPRIMER") redirect("/compte?erreur=" + encodeURIComponent("Écris SUPPRIMER pour confirmer."));
  if (user.role === "ADMIN") redirect("/compte?erreur=" + encodeURIComponent("Un administrateur ne peut pas supprimer son compte ici."));
  const subId = user.subscription?.stripeSubscriptionId;
  if (subId && stripeEnabled()) {
    try {
      await stripe().subscriptions.cancel(subId);
    } catch (e) {
      console.error("Annulation Stripe impossible", e);
    }
  }
  await audit(null, "account.delete", { role: user.role });
  await destroySession();
  await db.user.delete({ where: { id: user.id } });
  redirect("/?ok=" + encodeURIComponent("Ton compte et tes données ont été supprimés."));
}
