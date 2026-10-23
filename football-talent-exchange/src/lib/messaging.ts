import "server-only";
import { db } from "./db";
import { detectScam } from "./domain/scam";
import { appUrl, sendEmail } from "./email";
import { messagesFor } from "@/i18n/server";

export async function postMessage(conversationId: string, senderId: string, body: string, extra?: { trialDate?: Date | null; trialPlace?: string | null }) {
  const scamFlags = detectScam(body);
  const msg = await db.message.create({
    data: { conversationId, senderId, body, scamFlags, trialDate: extra?.trialDate ?? null, trialPlace: extra?.trialPlace ?? null },
  });
  await db.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
  await db.participant.updateMany({ where: { conversationId, userId: senderId }, data: { lastReadAt: new Date() } });
  const others = await db.participant.findMany({ where: { conversationId, userId: { not: senderId } }, include: { user: true } });
  const sender = await db.user.findUnique({ where: { id: senderId } });
  for (const o of others) {
    const m = messagesFor(o.user.locale);
    await sendEmail(o.user.email, m.email.newMessageSubject(sender?.name ?? "…"), m.email.newMessageBody(`${appUrl()}/messages/${conversationId}`, scamFlags.length > 0));
  }
  return msg;
}

export async function isBlocked(a: string, b: string) {
  return !!(await db.block.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } }));
}
