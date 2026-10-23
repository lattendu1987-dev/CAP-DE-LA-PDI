import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SCAM_WARNING } from "@/lib/domain/scam";
import { RECRUITER_TYPE_LABELS } from "@/lib/domain/reference";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { blockAction, reportAction, sendMessageAction } from "@/app/actions/messages";

export const metadata = { title: "Conversation" };

const ROLE_LABEL: Record<string, string> = { PLAYER: "Joueur", GUARDIAN: "Représentant légal", RECRUITER: "Recruteur", ADMIN: "Équipe" };

export default async function ConversationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
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
      <Link href="/messages" className="link text-sm">← Tous les messages</Link>
      <div className="card">
        <p className="text-sm text-gray-500">Participants</p>
        <ul className="mt-1 space-y-1">
          {others.map((o) => (
            <li key={o.userId} className="flex flex-wrap items-center gap-2 text-sm">
              <b>{o.user.name}</b>
              <Badge>{ROLE_LABEL[o.user.role]}</Badge>
              {o.user.recruiter && (
                <>
                  <span className="text-gray-600">{RECRUITER_TYPE_LABELS[o.user.recruiter.type]} · {o.user.recruiter.organization}</span>
                  {o.user.recruiter.verification === "VERIFIED" ? <Badge tone="blue">✓ Vérifié</Badge> : <Badge tone="gold">Non vérifié</Badge>}
                </>
              )}
            </li>
          ))}
        </ul>
        {player && <p className="mt-2 text-sm">Au sujet de : <Link className="link" href={`/joueurs/${player.slug}`}>{player.firstName} {player.lastName}</Link></p>}
      </div>
      <Flash sp={sp} />

      <div className="space-y-3">
        {conv.messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${mine ? "bg-pitch-600 text-white" : "bg-white"}`}>
                {!mine && <p className="mb-1 text-xs font-semibold text-gray-500">{m.sender.name}</p>}
                <p className="whitespace-pre-line">{m.body}</p>
                {m.trialDate && (
                  <p className={`mt-2 rounded-lg px-2 py-1 text-xs ${mine ? "bg-white/15" : "bg-pitch-50 text-pitch-900"}`}>
                    📅 Invitation à un essai : {m.trialDate.toLocaleString("fr-CA", { dateStyle: "full", timeStyle: "short" })}{m.trialPlace ? ` — ${m.trialPlace}` : ""}
                  </p>
                )}
                {!mine && m.scamFlags.length > 0 && <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-800">⚠️ {SCAM_WARNING}</p>}
                <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-gray-400"}`}>{m.createdAt.toLocaleString("fr-CA", { dateStyle: "short", timeStyle: "short" })}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form action={sendMessageAction} className="card space-y-3">
        <input type="hidden" name="conversationId" value={conv.id} />
        <textarea name="body" required maxLength={3000} className="input min-h-24" placeholder="Ton message…" />
        {user.role === "RECRUITER" && (
          <details className="text-sm">
            <summary className="cursor-pointer text-pitch-700">+ Joindre une invitation à un essai</summary>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input className="input" type="datetime-local" name="trialDate" />
              <input className="input" name="trialPlace" placeholder="Lieu (stade, ville)" />
            </div>
          </details>
        )}
        <SubmitButton>Envoyer</SubmitButton>
      </form>

      <details className="card text-sm">
        <summary className="cursor-pointer font-semibold text-gray-700">Un problème avec ce contact ?</summary>
        <p className="muted mt-2">Ne paie jamais de frais pour un essai, un visa ou une signature. Signale tout comportement suspect.</p>
        {others.filter((o) => o.user.role !== "ADMIN").map((o) => (
          <div key={o.userId} className="mt-3 flex flex-wrap gap-2">
            <form action={reportAction} className="flex flex-wrap gap-2">
              <input type="hidden" name="conversationId" value={conv.id} />
              <input type="hidden" name="reportedId" value={o.userId} />
              <select name="reason" className="input w-auto">
                <option value="ARNAQUE">Demande d&apos;argent / arnaque</option>
                <option value="FAUX_PROFIL">Faux profil</option>
                <option value="HARCELEMENT">Harcèlement / propos inappropriés</option>
                <option value="AUTRE">Autre</option>
              </select>
              <button className="btn-secondary btn-sm">Signaler {o.user.name}</button>
            </form>
            <form action={blockAction}>
              <input type="hidden" name="conversationId" value={conv.id} />
              <input type="hidden" name="blockedId" value={o.userId} />
              <button className="btn-danger btn-sm">Bloquer</button>
            </form>
          </div>
        ))}
      </details>
    </div>
  );
}
