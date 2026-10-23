"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail, appUrl } from "@/lib/email";

const go = (msg: string): never => redirect(`/tuteur?ok=${encodeURIComponent(msg)}`);

async function myWard(fd: FormData) {
  const user = await requireUser(["GUARDIAN"]);
  const player = await db.playerProfile.findFirst({ where: { id: String(fd.get("playerId")), guardianId: user.id }, include: { user: true } });
  if (!player) redirect("/tuteur");
  return { user, player };
}

export async function giveConsentAction(fd: FormData) {
  const { user, player } = await myWard(fd);
  await db.playerProfile.update({ where: { id: player.id }, data: { guardianConsentAt: new Date() } });
  await audit(user.id, "guardian.consent", { playerId: player.id });
  await sendEmail(player.user.email, "Ton profil est maintenant visible", `Bonne nouvelle : ton représentant légal a confirmé ton inscription. Les recruteurs peuvent maintenant voir ton profil.\n\n${appUrl()}/joueur`);
  go("Merci ! Le profil est maintenant visible par les recruteurs vérifiés.");
}

export async function withdrawConsentAction(fd: FormData) {
  const { user, player } = await myWard(fd);
  await db.playerProfile.update({ where: { id: player.id }, data: { guardianConsentAt: null } });
  await audit(user.id, "guardian.withdraw", { playerId: player.id });
  go("Consentement retiré : le profil n'est plus visible.");
}
