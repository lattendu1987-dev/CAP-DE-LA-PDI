import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { canView, loadPlayerBySlug } from "@/lib/players";
import { ageOn, isMinor } from "@/lib/domain/age";
import { isPremiumPlayer } from "@/lib/domain/rules";
import { footLabel, levelLabel, positionLabel } from "@/lib/domain/reference";
import { appUrl } from "@/lib/email";
import { Avatar, Badge, Field, Flash, Stat } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { SubmitButton } from "@/components/submit-button";
import { ShareButtons } from "@/components/share";
import { notifyLater } from "@/lib/push";
import { PROFILE_VIEW_COOLDOWN_MS } from "@/lib/domain/push";
import { addToShortlistAction, saveEvaluationAction, startConversationAction } from "@/app/actions/recruiter";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, m, locale] = await Promise.all([params, getMessages(), getLocale()]);
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, null)) return { title: m.meta.title, robots: { index: false } };
  const pos = positionLabel(m, p.mainPosition);
  const title = m.profile.metaTitle(`${p.firstName} ${p.lastName}`, pos);
  const description = m.profile.metaDescription(pos, ageOn(p.birthDate), countryName(p.country, locale));
  return { title, description, openGraph: { title, description, images: p.photoUrl ? [p.photoUrl] : [] } };
}

export default async function PlayerPublicPage({ params, searchParams }: Props) {
  const [{ slug }, sp, viewer, m, locale] = await Promise.all([params, searchParams, getCurrentUser(), getMessages(), getLocale()]);
  const t = m.profile;
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, viewer)) notFound();

  const isRecruiter = viewer?.role === "RECRUITER" && viewer.recruiter;
  if (viewer?.id !== p.userId) {
    const recent = isRecruiter
      ? await db.profileView.findFirst({ where: { playerId: p.id, viewerId: viewer!.id, createdAt: { gt: new Date(Date.now() - PROFILE_VIEW_COOLDOWN_MS) } } })
      : null;
    await db.profileView.create({ data: { playerId: p.id, viewerId: isRecruiter ? viewer!.id : null } });
    if (isRecruiter && !recent) {
      // Premium : le nom du club ; gratuit : « un recruteur » (incite à passer Premium).
      const named = isPremiumPlayer(p.user.subscription);
      const org = viewer!.recruiter!.organization;
      notifyLater(p.userId, (pm) => ({ title: pm.push.profileViewTitle, body: named ? pm.push.profileViewNamed(org) : pm.push.profileViewAnon, url: "/joueur", tag: "profile-view" }));
    }
  }
  const [shortlists, evaluation] = isRecruiter
    ? await Promise.all([
        db.shortlist.findMany({ where: { recruiterId: viewer!.recruiter!.id }, orderBy: { createdAt: "asc" } }),
        db.evaluation.findUnique({ where: { recruiterId_playerId: { recruiterId: viewer!.recruiter!.id, playerId: p.id } } }),
      ])
    : [[], null];

  const name = `${p.firstName} ${p.lastName}`;
  const minor = isMinor(p.birthDate);
  const totals = p.stats.reduce((a, s) => ({ m: a.m + s.matches, g: a.g + s.goals, a: a.a + s.assists, cs: a.cs + s.cleanSheets }), { m: 0, g: 0, a: 0, cs: 0 });
  const gk = p.mainPosition === "GB";
  const url = `${appUrl()}/joueurs/${p.slug}`;
  const h = m.player.statsHead;

  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={name} url={p.photoUrl} size={96} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h1">{name}</h1>
            {isPremiumPlayer(p.user.subscription) && <Badge tone="gold">{m.labels.premium}</Badge>}
            {minor && <Badge tone="blue">{m.labels.minorBadge}</Badge>}
          </div>
          <p className="mt-1 text-gray-700">
            <b>{positionLabel(m, p.mainPosition)}</b>
            {p.otherPositions.length > 0 && <> · {t.alsoPlays(p.otherPositions.map((c) => positionLabel(m, c)).join(", "))}</>}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.contractStatus === "FREE" ? <Badge tone="green">{m.labels.freeOfContract}</Badge> : <Badge>{p.contractEnd ? m.labels.underContractUntil(formatDate(p.contractEnd, locale)) : m.labels.underContract}</Badge>}
            <Badge>{m.labels.availability[p.availability]}</Badge>
            <Badge>{p.hasAgent ? m.labels.withAgent : m.labels.withoutAgent}</Badge>
            {p.willingToRelocate && <Badge tone="green">{m.labels.willingToRelocate}</Badge>}
          </div>
        </div>
        <div className="no-print flex flex-col gap-2">
          <Link href={`/joueurs/${p.slug}/cv`} className="btn-secondary btn-sm">{m.player.pdf}</Link>
          {!minor && <ShareButtons url={url} text={m.player.shareText(name, url)} labels={{ whatsapp: m.common.shareWhatsApp, copy: m.common.copy, copied: m.common.copied }} />}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label={t.age} value={m.common.years(ageOn(p.birthDate))} />
        <Stat label={t.height} value={p.heightCm ? `${p.heightCm} cm` : "—"} />
        <Stat label={t.weight} value={p.weightKg ? `${p.weightKg} kg` : "—"} />
        <Stat label={t.foot} value={footLabel(m, p.foot)} />
        <Stat label={t.country} value={countryName(p.country, locale)} />
        <Stat label={t.level} value={<span className="text-sm">{levelLabel(m, p.currentLevel)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {p.bio && <section className="card"><h2 className="h2 mb-2">{t.bio}</h2><p className="whitespace-pre-line text-gray-700">{p.bio}</p></section>}
          <section className="card">
            <h2 className="h2 mb-4">{t.videos}</h2>
            {p.videos.length === 0 ? <p className="muted">{t.noVideos}</p> : (
              <div className="space-y-6">
                {p.videos.map((v) => (
                  <div key={v.id}>
                    <p className="mb-2 font-semibold">{v.title} <Badge>{m.labels.videoKinds[v.kind as "HIGHLIGHTS" | "FULL_MATCH"]}</Badge></p>
                    <VideoPlayer url={v.url} title={v.title} moments={v.moments} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card">
            <h2 className="h2 mb-4">{t.stats}</h2>
            {p.stats.length === 0 ? <p className="muted">{t.noStats}</p> : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <Stat label={t.totals.matches} value={totals.m} />
                  {gk ? <Stat label={t.totals.cleanSheets} value={totals.cs} /> : <Stat label={t.totals.goals} value={totals.g} />}
                  <Stat label={t.totals.assists} value={totals.a} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="text-xs uppercase text-gray-500"><tr><th className="py-2 text-start">{m.player.season}</th><th className="text-start">{m.player.club}</th><th>{h.matches}</th><th>{h.minutes}</th>{gk ? <><th>{h.cleanSheets}</th><th>{h.saves}</th></> : <><th>{h.goals}</th><th>{h.assists}</th></>}<th /></tr></thead>
                    <tbody>
                      {p.stats.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100 text-center">
                          <td className="py-2 text-start font-semibold">{s.season}</td><td className="text-start">{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td>
                          {gk ? <><td>{s.cleanSheets}</td><td>{s.saves}</td></> : <><td>{s.goals}</td><td>{s.assists}</td></>}
                          <td>{s.verified ? <Badge tone="blue">{m.labels.verified}</Badge> : <Badge>{m.labels.declared}</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
          <section className="card">
            <h2 className="h2 mb-4">{t.career}</h2>
            {p.career.length === 0 ? <p className="muted">{t.noCareer}</p> : (
              <ol className="relative space-y-4 border-s-2 border-pitch-100 ps-5">
                {p.career.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -start-[27px] top-1.5 h-3 w-3 rounded-full bg-pitch-500" />
                    <p className="font-semibold">{e.club}</p>
                    <p className="muted">{e.startYear}–{e.endYear ?? m.common.today} · {levelLabel(m, e.level)}{e.country ? ` · ${countryName(e.country, locale)}` : ""}</p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <aside className="no-print space-y-4">
          {isRecruiter ? (
            <>
              <form action={startConversationAction} className="card space-y-3">
                <h2 className="h2">{t.contactTitle(p.firstName)}</h2>
                {minor && <p className="text-xs text-gray-600">{t.contactMinor}</p>}
                <input type="hidden" name="playerId" value={p.id} />
                <textarea name="body" required minLength={20} maxLength={3000} className="input min-h-28" placeholder={t.contactPlaceholder} />
                <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{m.common.send}</SubmitButton>
              </form>
              <form action={addToShortlistAction} className="card space-y-3">
                <h2 className="h2">{t.addToList}</h2>
                <input type="hidden" name="playerId" value={p.id} />
                <select name="shortlistId" className="input">
                  {shortlists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="">{t.newList}</option>
                </select>
                <input name="newName" className="input" placeholder={t.newListName} />
                <SubmitButton className="btn-secondary w-full" pendingLabel={m.common.wait}>{m.common.add}</SubmitButton>
              </form>
              <form action={saveEvaluationAction} className="card space-y-3">
                <h2 className="h2">{t.evaluation}</h2>
                <p className="text-xs text-gray-500">{t.evaluationPrivate}</p>
                <input type="hidden" name="playerId" value={p.id} />
                {(["technical", "physical", "tactical", "mental"] as const).map((k) => (
                  <Field key={k} label={`${t.evalLabels[k]} ${t.scale}`}>
                    <input className="w-full accent-pitch-600" type="range" min={1} max={10} name={k} defaultValue={evaluation?.[k] ?? 5} />
                  </Field>
                ))}
                <textarea name="comment" className="input" maxLength={2000} defaultValue={evaluation?.comment ?? ""} placeholder={t.notesPlaceholder} />
                <SubmitButton className="btn-secondary w-full" pendingLabel={m.common.wait}>{m.common.save}</SubmitButton>
              </form>
            </>
          ) : !viewer ? (
            <div className="card">
              <h2 className="h2">{t.recruiterCta}</h2>
              <p className="muted mt-1">{t.recruiterCtaText}</p>
              <Link href="/inscription?role=recruteur" className="btn-primary mt-3 w-full">{t.freeTrial}</Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
