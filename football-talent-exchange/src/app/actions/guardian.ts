"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail, appUrl } from "@/lib/email";
import { getMessages, messagesFor } from "@/i18n/server";
import { notifyLater } from "@/lib/push";

const go = (msg: string): never => redirect(`/tuteur?ok=${encodeURIComponent(msg)}`);

async function myWard(fd: FormData) {
  const user = await requireUser(["GUARDIAN"]);
  const player = await db.playerProfile.findFirst({ where: { id: String(fd.get("playerId")), guardianId: user.id }, include: { user: true } });
  if (!player) redirect("/tuteur");
  return { user, player, m: await getMessages() };
}

export async function giveConsentAction(fd: FormData) {
  const { user, player, m } = await myWard(fd);
  await db.playerProfile.update({ where: { id: player.id }, data: { guardianConsentAt: new Date() } });
  await audit(user.id, "guardian.consent", { playerId: player.id });
  const pm = messagesFor(player.user.locale);
  await sendEmail(player.user.email, pm.email.consentSubject, pm.email.consentBody(`${appUrl()}/joueur`));
  notifyLater(player.userId, (x) => ({ title: x.push.consentTitle, body: x.push.consentBody, url: "/joueur", tag: "consent" }));
  go(m.guardian.given);
}

export async function withdrawConsentAction(fd: FormData) {
  const { user, player, m } = await myWard(fd);
  await db.playerProfile.update({ where: { id: player.id }, data: { guardianConsentAt: null } });
  await audit(user.id, "guardian.withdraw", { playerId: player.id });
  go(m.guardian.withdrawn);
}
