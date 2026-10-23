"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";

const go = (msg: string): never => redirect(`/admin?ok=${encodeURIComponent(msg)}`);

export async function setVerificationAction(fd: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = String(fd.get("id"));
  const status = fd.get("status") === "VERIFIED" ? "VERIFIED" : "REJECTED";
  const r = await db.recruiterProfile.update({ where: { id }, data: { verification: status }, include: { user: true } });
  await audit(admin.id, "admin.verification", { id, status });
  await sendEmail(r.user.email, status === "VERIFIED" ? "Ton compte recruteur est vérifié ✓" : "Vérification de ton compte recruteur",
    status === "VERIFIED" ? "Ton compte affiche maintenant le badge « Recruteur vérifié ». Tu peux aussi contacter les joueurs mineurs (via leur représentant légal)." : "Nous n'avons pas pu vérifier ton compte. Réponds à ce courriel avec une preuve de ton rôle (licence, lettre du club).");
  go("Vérification mise à jour.");
}

export async function resolveReportAction(fd: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = String(fd.get("id"));
  const action = String(fd.get("action"));
  const report = await db.report.findUniqueOrThrow({ where: { id } });
  if (action === "SUSPEND") {
    await db.user.update({ where: { id: report.reportedId }, data: { suspended: true } });
    await db.session.deleteMany({ where: { userId: report.reportedId } });
  }
  await db.report.update({ where: { id }, data: { status: action === "DISMISS" ? "DISMISSED" : "RESOLVED" } });
  await audit(admin.id, "admin.report", { id, action });
  go(action === "SUSPEND" ? "Compte suspendu." : "Signalement traité.");
}

export async function setSuspendedAction(fd: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const userId = String(fd.get("userId"));
  const suspended = fd.get("suspended") === "1";
  if (userId === admin.id) go("Impossible de te suspendre toi-même.");
  await db.user.update({ where: { id: userId }, data: { suspended } });
  if (suspended) await db.session.deleteMany({ where: { userId } });
  await audit(admin.id, "admin.suspend", { userId, suspended });
  go(suspended ? "Compte suspendu." : "Compte réactivé.");
}

export async function verifyStatAction(fd: FormData) {
  const admin = await requireUser(["ADMIN"]);
  const id = String(fd.get("id"));
  await db.seasonStat.update({ where: { id }, data: { verified: fd.get("verified") === "1" } });
  await audit(admin.id, "admin.stat", { id });
  go("Statistique mise à jour.");
}
