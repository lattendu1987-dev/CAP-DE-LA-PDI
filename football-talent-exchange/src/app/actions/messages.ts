"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isBlocked, postMessage } from "@/lib/messaging";
import { audit } from "@/lib/audit";
import { getMessages } from "@/i18n/server";

const go = (path: string, msg: string, err = false): never => redirect(`${path}?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}`);

async function myConversation(conversationId: string, userId: string) {
  const conv = await db.conversation.findFirst({ where: { id: conversationId, participants: { some: { userId } } }, include: { participants: true } });
  if (!conv) redirect("/messages");
  return conv;
}

export async function sendMessageAction(fd: FormData) {
  const user = await requireUser();
  const t = (await getMessages()).messages.flash;
  const conversationId = String(fd.get("conversationId"));
  const path = `/messages/${conversationId}`;
  const conv = await myConversation(conversationId, user.id);
  const body = String(fd.get("body") ?? "").trim();
  if (!body || body.length > 3000) go(path, t.invalid, true);
  for (const p of conv.participants) {
    if (p.userId !== user.id && (await isBlocked(user.id, p.userId))) go(path, t.blocked, true);
  }
  // Anti-spam : 60 messages par heure maximum.
  const recent = await db.message.count({ where: { senderId: user.id, createdAt: { gte: new Date(Date.now() - 3600000) } } });
  if (recent >= 60) go(path, t.rate, true);

  let trialDate: Date | null = null;
  let trialPlace: string | null = null;
  if (user.role === "RECRUITER" && fd.get("trialDate")) {
    trialDate = new Date(String(fd.get("trialDate")));
    trialPlace = String(fd.get("trialPlace") ?? "").trim().slice(0, 200) || null;
    if (isNaN(trialDate.getTime()) || trialDate < new Date()) go(path, t.badTrialDate, true);
  }
  await postMessage(conversationId, user.id, body, { trialDate, trialPlace });
  redirect(path);
}

export async function reportAction(fd: FormData) {
  const user = await requireUser();
  const t = (await getMessages()).messages.flash;
  const conversationId = String(fd.get("conversationId"));
  const conv = await myConversation(conversationId, user.id);
  const reportedId = String(fd.get("reportedId"));
  if (!conv.participants.some((p) => p.userId === reportedId) || reportedId === user.id) go(`/messages/${conversationId}`, t.reportImpossible, true);
  const reason = String(fd.get("reason") ?? "AUTRE").slice(0, 40);
  await db.report.create({ data: { reporterId: user.id, reportedId, reason, details: `Conversation ${conversationId}. ${String(fd.get("details") ?? "").slice(0, 1000)}` } });
  await audit(user.id, "report", { reportedId, reason });
  go(`/messages/${conversationId}`, t.reported);
}

export async function blockAction(fd: FormData) {
  const user = await requireUser();
  const t = (await getMessages()).messages.flash;
  const conversationId = String(fd.get("conversationId"));
  const conv = await myConversation(conversationId, user.id);
  const blockedId = String(fd.get("blockedId"));
  if (!conv.participants.some((p) => p.userId === blockedId) || blockedId === user.id) go("/messages", t.blockImpossible, true);
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId } }, create: { blockerId: user.id, blockedId }, update: {} });
  go(`/messages/${conversationId}`, t.blockedDone);
}
