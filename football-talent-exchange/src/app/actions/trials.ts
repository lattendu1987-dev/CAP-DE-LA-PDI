"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMessages, messagesFor } from "@/i18n/server";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { isMinor } from "@/lib/domain/age";
import { eligibleAge, isOpen, validTrialDates } from "@/lib/domain/trials";
import { POSITION_CODES } from "@/lib/domain/reference";
import { detectScam } from "@/lib/domain/scam";
import { appUrl, sendEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

const go = (path: string, msg: string, err = false): never => redirect(`${path}?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

export async function createTrialAction(fd: FormData) {
  const user = await requireUser(["RECRUITER"]);
  const t = (await getMessages()).trials.flash;
  if (user.recruiter?.verification !== "VERIFIED" || !isSubscriptionActive(user.subscription)) go("/detections/nouvelle", t.notAllowed, true);
  const optAge = z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(10).max(45).optional());
  const r = z
    .object({
      title: z.string().trim().min(5).max(120),
      description: z.string().trim().min(20).max(3000),
      city: z.string().trim().min(2).max(80),
      country: z.string().length(2),
      startsAt: z.coerce.date(),
      deadline: z.coerce.date(),
      minAge: optAge,
      maxAge: optAge,
      free: z.literal("on"),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) go("/detections/nouvelle", t.invalid, true);
  const d = r.data!;
  if (!validTrialDates(d.startsAt, d.deadline)) go("/detections/nouvelle", t.dates, true);
  if (d.minAge && d.maxAge && d.minAge > d.maxAge) go("/detections/nouvelle", t.invalid, true);
  // Une annonce qui demande de l'argent est refusée d'office.
  if (detectScam(`${d.title} ${d.description}`).length > 0) go("/detections/nouvelle", t.invalid, true);
  if ((await db.trialEvent.count({ where: { recruiterId: user.id, startsAt: { gt: new Date() } } })) >= 20) go("/detections/nouvelle", t.max, true);
  const positions = fd.getAll("positions").map(String).filter((p) => (POSITION_CODES as readonly string[]).includes(p));
  const trial = await db.trialEvent.create({
    data: { recruiterId: user.id, title: d.title, description: d.description, city: d.city, country: d.country, startsAt: d.startsAt, deadline: d.deadline, minAge: d.minAge ?? null, maxAge: d.maxAge ?? null, positions, free: true },
  });
  await audit(user.id, "trial.create", { id: trial.id });
  go(`/detections/${trial.id}`, t.created);
}

export async function applyTrialAction(fd: FormData) {
  const user = await requireUser(["PLAYER"]);
  const m = await getMessages();
  const t = m.trials.flash;
  const id = String(fd.get("trialId"));
  const path = `/detections/${id}`;
  const trial = await db.trialEvent.findUnique({ where: { id }, include: { recruiter: { include: { recruiter: true } } } });
  if (!trial) redirect("/detections");
  const p = user.player!;
  if (!isOpen(trial)) go(path, t.closed, true);
  if (!eligibleAge(trial, p.birthDate)) go(path, m.trials.notEligibleAge, true);
  if (isMinor(p.birthDate) && (!p.guardianConsentAt || trial.recruiter.recruiter?.verification !== "VERIFIED")) go(path, m.trials.minorNotAllowed, true);
  if (await db.trialApplication.findUnique({ where: { trialId_playerUserId: { trialId: id, playerUserId: user.id } } })) go(path, t.already, true);
  await db.trialApplication.create({ data: { trialId: id, playerUserId: user.id, message: String(fd.get("message") ?? "").trim().slice(0, 1000) || null } });
  const rm = messagesFor(trial.recruiter.locale);
  await sendEmail(trial.recruiter.email, rm.email.applicationSubject(trial.title), rm.email.applicationBody(`${p.firstName} ${p.lastName}`, `${appUrl()}${path}`));
  go(path, t.applied);
}

export async function setApplicationStatusAction(fd: FormData) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const m = await getMessages();
  const status = z.enum(["SHORTLISTED", "INVITED", "DECLINED"]).parse(fd.get("status"));
  const app = await db.trialApplication.findUnique({ where: { id: String(fd.get("id")) }, include: { trial: true, playerUser: { include: { player: true } } } });
  if (!app || (user.role !== "ADMIN" && app.trial.recruiterId !== user.id)) redirect("/detections");
  await db.trialApplication.update({ where: { id: app.id }, data: { status } });
  const pm = messagesFor(app.playerUser.locale);
  const link = `${appUrl()}/detections/${app.trialId}`;
  await sendEmail(app.playerUser.email, pm.email.statusSubject(app.trial.title), pm.email.statusBody(pm.labels.appStatus[status], link));
  // Le représentant légal d'un mineur est aussi prévenu.
  const guardianId = app.playerUser.player?.guardianId;
  if (guardianId) {
    const g = await db.user.findUnique({ where: { id: guardianId } });
    if (g) {
      const gm = messagesFor(g.locale);
      await sendEmail(g.email, gm.email.statusSubject(app.trial.title), gm.email.statusBody(gm.labels.appStatus[status], link));
    }
  }
  go(`/detections/${app.trialId}`, m.trials.flash.statusUpdated);
}

export async function deleteTrialAction(fd: FormData) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const m = await getMessages();
  const id = String(fd.get("id"));
  await db.trialEvent.deleteMany({ where: user.role === "ADMIN" ? { id } : { id, recruiterId: user.id } });
  go("/detections", m.trials.flash.deleted);
}
