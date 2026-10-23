"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { getMessages, messagesFor } from "@/i18n/server";
import { notifyLater } from "@/lib/push";

async function admin() {
  const user = await requireUser(["ADMIN"]);
  return { user, t: (await getMessages()).admin.flash };
}
const go = (msg: string): never => redirect(`/admin?ok=${encodeURIComponent(msg)}`);

export async function setVerificationAction(fd: FormData) {
  const { user, t } = await admin();
  const id = String(fd.get("id"));
  const status = fd.get("status") === "VERIFIED" ? "VERIFIED" : "REJECTED";
  const r = await db.recruiterProfile.update({ where: { id }, data: { verification: status }, include: { user: true } });
  await audit(user.id, "admin.verification", { id, status });
  const m = messagesFor(r.user.locale);
  await sendEmail(r.user.email, status === "VERIFIED" ? m.email.verifiedSubject : m.email.rejectedSubject, status === "VERIFIED" ? m.email.verifiedBody : m.email.rejectedBody);
  if (status === "VERIFIED") notifyLater(r.userId, (x) => ({ title: x.push.verifiedTitle, body: x.push.verifiedBody, url: "/recruteur/recherche", tag: "verified" }));
  go(t.verification);
}

export async function resolveReportAction(fd: FormData) {
  const { user, t } = await admin();
  const id = String(fd.get("id"));
  const action = String(fd.get("action"));
  const report = await db.report.findUniqueOrThrow({ where: { id } });
  if (action === "SUSPEND") {
    await db.user.update({ where: { id: report.reportedId }, data: { suspended: true } });
    await db.session.deleteMany({ where: { userId: report.reportedId } });
    // Les commissions en attente d'un compte frauduleux sont annulées.
    await db.commission.updateMany({ where: { OR: [{ earnerId: report.reportedId }, { sourceId: report.reportedId }], status: "PENDING" }, data: { status: "CANCELED" } });
  }
  await db.report.update({ where: { id }, data: { status: action === "DISMISS" ? "DISMISSED" : "RESOLVED" } });
  await audit(user.id, "admin.report", { id, action });
  go(action === "SUSPEND" ? t.suspended : t.reportDone);
}

export async function setSuspendedAction(fd: FormData) {
  const { user, t } = await admin();
  const userId = String(fd.get("userId"));
  const suspended = fd.get("suspended") === "1";
  if (userId === user.id) go(t.notSelf);
  await db.user.update({ where: { id: userId }, data: { suspended } });
  if (suspended) {
    await db.session.deleteMany({ where: { userId } });
    await db.commission.updateMany({ where: { OR: [{ earnerId: userId }, { sourceId: userId }], status: "PENDING" }, data: { status: "CANCELED" } });
  }
  await audit(user.id, "admin.suspend", { userId, suspended });
  go(suspended ? t.suspended : t.reactivated);
}

export async function verifyStatAction(fd: FormData) {
  const { user, t } = await admin();
  const id = String(fd.get("id"));
  await db.seasonStat.update({ where: { id }, data: { verified: fd.get("verified") === "1" } });
  await audit(user.id, "admin.stat", { id });
  go(t.stat);
}

export async function setPayoutAction(fd: FormData) {
  const { user, t } = await admin();
  const id = String(fd.get("id"));
  const status = fd.get("status") === "PAID" ? "PAID" : "REJECTED";
  await db.payout.updateMany({ where: { id, status: "REQUESTED" }, data: { status, processedAt: new Date() } });
  await audit(user.id, "admin.payout", { id, status });
  go(t.payout);
}
