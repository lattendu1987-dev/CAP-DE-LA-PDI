import "server-only";
import { db } from "./db";
import { detectScam } from "./domain/scam";
import { appUrl, sendEmail } from "./email";

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
    await sendEmail(
      o.user.email,
      `Nouveau message de ${sender?.name ?? "un membre"}`,
      `Vous avez reçu un nouveau message sur Football Talent Exchange.\n\nLire et répondre : ${appUrl()}/messages/${conversationId}\n\n` +
        (scamFlags.length ? "⚠️ Ce message contient une demande d'argent ou de documents. Un vrai club ne demande jamais de frais.\n" : ""),
    );
  }
  return msg;
}

export async function isBlocked(a: string, b: string) {
  return !!(await db.block.findFirst({ where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] } }));
}
