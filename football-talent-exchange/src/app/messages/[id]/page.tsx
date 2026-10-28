import { FormAutosave } from "@/components/form-autosave";
import { autosaveText } from "@/lib/ui-text";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate } from "@/i18n/format";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { blockAction, reportAction, sendMessageAction } from "@/app/actions/messages";

export async function generateMetadata() {
  return { title: (await getMessages()).messages.metaTitle };
}

export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const [{ id }, sp, m, locale] = await Promise.all([params, searchParams, getMessages(), getLocale()]);
  const t = m.messages;
  const conv = await db.conversation.findFirst({
    where: { id, participants: { some: { userId: user.id } } },
    include: {
      participants: { include: { user: { include: { recruiter: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: true } },
    },
  });
  if (!conv) notFound();
  await db.participant.updateMany({ where: { conversationId: id, userId: user.id }, data: { lastReadAt: new Date() } });
  const others = conv.participants.filter((p) => p.userId !== user.id);
  const player = conv.playerId ? await db.playerProfile.findUnique({ where: { id: conv.playerId }, select: { slug: true, firstName: true, lastName: true } }) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/messages" className="link text-sm">{t.allMessages}</Link>
      <div className="card">
        <p className="text-sm text-gray-500">{t.participants}</p>
        <ul className="mt-1 space-y-1">
          {others.map((o) => (
            <li key={o.userId} className="flex flex-wrap items-center gap-2 text-sm">
              <b>{o.user.name}</b>
              <Badge>{m.labels.roles[o.user.role]}</Badge>
              {o.user.recruiter && (
                <>
                  <span className="text-gray-600">{m.labels.recruiterTypes[o.user.recruiter.type]} · {o.user.recruiter.organization}</span>
                  {o.user.recruiter.verification === "VERIFIED" ? <Badge tone="blue">{m.labels.verifiedShort}</Badge> : <Badge tone="gold">{m.labels.notVerified}</Badge>}
                </>
              )}
            </li>
          ))}
        </ul>
        {player && <p className="mt-2 text-sm">{t.about} <Link className="link" href={`/joueurs/${player.slug}`}>{player.firstName} {player.lastName}</Link></p>}
      </div>
      <Flash sp={sp} />

      <div className="space-y-3">
        {conv.messages.map((msg) => {
          const mine = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? "bg-pitch-600 text-white" : "bg-white"}`}>
                {!mine && <p className="mb-1 text-xs font-semibold text-gray-500">{msg.sender.name}</p>}
                <p className="whitespace-pre-line" dir="auto">{msg.body}</p>
                {msg.trialDate && (
                  <p className={`mt-2 rounded-lg px-2 py-1 text-xs ${mine ? "bg-white/15" : "bg-pitch-50 text-pitch-900"}`}>
                    {t.trialInvite(formatDate(msg.trialDate, locale, { dateStyle: "full", timeStyle: "short" }), msg.trialPlace ?? "")}
                  </p>
                )}
                {!mine && msg.scamFlags.length > 0 && <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-800">⚠️ {t.scamWarning}</p>}
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>{formatDate(msg.createdAt, locale, { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form action={sendMessageAction} className="card space-y-3">
        <input type="hidden" name="conversationId" value={conv.id} />
        <FormAutosave id={`message-${conv.id}`} text={autosaveText(m)} />
        <textarea name="body" required maxLength={3000} className="input min-h-24" placeholder={t.placeholder} dir="auto" />
        {user.role === "RECRUITER" && (
          <details className="text-sm">
            <summary className="cursor-pointer text-pitch-700">{t.attachTrial}</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className="input" type="datetime-local" name="trialDate" />
              <input className="input" name="trialPlace" placeholder={t.trialPlace} />
            </div>
          </details>
        )}
        <SubmitButton pendingLabel={m.common.wait}>{m.common.send}</SubmitButton>
      </form>

      <details className="card text-sm">
        <summary className="cursor-pointer font-semibold text-gray-700">{t.problem}</summary>
        <p className="muted mt-2">{t.problemText}</p>
        {others.filter((o) => o.user.role !== "ADMIN").map((o) => (
          <div key={o.userId} className="mt-3 flex flex-wrap gap-2">
            <form action={reportAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="conversationId" value={conv.id} />
              <input type="hidden" name="reportedId" value={o.userId} />
              <select name="reason" className="input w-auto">
                {(Object.keys(t.reasons) as (keyof typeof t.reasons)[]).map((k) => <option key={k} value={k}>{t.reasons[k]}</option>)}
              </select>
              <button className="btn-secondary btn-sm">{t.report(o.user.name)}</button>
            </form>
            <form action={blockAction}>
              <input type="hidden" name="conversationId" value={conv.id} />
              <input type="hidden" name="blockedId" value={o.userId} />
              <button className="btn-danger btn-sm">{t.block}</button>
            </form>
          </div>
        ))}
      </details>
    </div>
  );
}
