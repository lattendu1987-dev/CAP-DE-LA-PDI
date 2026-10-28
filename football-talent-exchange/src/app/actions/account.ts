"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { destroySession, hashPassword, requireUser, verifyPassword } from "@/lib/auth";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { deleteStored } from "@/lib/storage";
import { getMessages } from "@/i18n/server";
import { audit } from "@/lib/audit";

const go = (path: string, key: "ok" | "erreur", msg: string): never => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);

export async function changePasswordAction(fd: FormData) {
  const user = await requireUser();
  const t = (await getMessages()).account.flash;
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (!(await verifyPassword(current, user.passwordHash))) go("/compte", "erreur", t.wrongPassword);
  if (next.length < 8) go("/compte", "erreur", t.passwordShort);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(next) } });
  go("/compte", "ok", t.passwordChanged);
}

export async function deleteAccountAction(fd: FormData) {
  const user = await requireUser();
  const m = await getMessages();
  const t = m.account.flash;
  if (String(fd.get("confirm") ?? "").trim().toUpperCase() !== m.account.deleteWord.toUpperCase()) go("/compte", "erreur", t.confirmDelete);
  if (user.role === "ADMIN") go("/compte", "erreur", t.adminNoDelete);
  const subId = user.subscription?.stripeSubscriptionId;
  if (subId && stripeEnabled()) {
    try {
      await stripe().subscriptions.cancel(subId);
    } catch (e) {
      console.error("Annulation Stripe impossible", e);
    }
  }
  // Suppression des fichiers envoyés (vidéos, photo).
  if (user.player) {
    const videos = await db.video.findMany({ where: { playerId: user.player.id, storageKey: { not: null } }, select: { storageKey: true } });
    for (const v of videos) await deleteStored(v.storageKey);
    await deleteStored(user.player.photoKey);
    await deleteStored(user.player.cvKey);
  }
  await audit(null, "account.delete", { role: user.role });
  await destroySession();
  await db.user.delete({ where: { id: user.id } });
  go("/", "ok", t.deleted);
}
