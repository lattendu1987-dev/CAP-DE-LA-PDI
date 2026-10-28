import { TrialsMap } from "@/components/trials-map";
import { directionsUrl } from "@/lib/domain/distance";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { positionLabel } from "@/lib/domain/reference";
import { isMinor, ageOn } from "@/lib/domain/age";
import { eligibleAge, isOpen } from "@/lib/domain/trials";
import { Badge, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { applyTrialAction, deleteTrialAction, setApplicationStatusAction } from "@/app/actions/trials";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const tr = await db.trialEvent.findUnique({ where: { id: (await params).id } });
  return { title: tr?.title ?? (await getMessages()).trials.metaTitle };
}

export default async function TrialPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const [{ id }, sp, m, locale, user] = await Promise.all([params, searchParams, getMessages(), getLocale(), getCurrentUser()]);
  const t = m.trials;
  const trial = await db.trialEvent.findUnique({ where: { id }, include: { recruiter: { include: { recruiter: true } } } });
  if (!trial || trial.recruiter.suspended) notFound();
  const owner = user && (user.id === trial.recruiterId || user.role === "ADMIN");
  const applications = owner
    ? await db.trialApplication.findMany({ where: { trialId: id }, include: { playerUser: { include: { player: true } } }, orderBy: { createdAt: "asc" } })
    : [];
  const mine = user?.role === "PLAYER" ? await db.trialApplication.findUnique({ where: { trialId_playerUserId: { trialId: id, playerUserId: user.id } } }) : null;
  const open = isOpen(trial);
  const p = user?.player;

  let applyBlock: React.ReactNode;
  if (mine) applyBlock = <p className="font-semibold text-pitch-700">{t.applied} · <Badge>{m.labels.appStatus[mine.status]}</Badge></p>;
  else if (!open) applyBlock = <p className="muted">{t.closed}</p>;
  else if (!user || user.role !== "PLAYER" || !p) applyBlock = <p className="muted">{t.onlyPlayers} <Link className="link" href="/inscription?role=joueur">{m.nav.signup}</Link></p>;
  else if (!eligibleAge(trial, p.birthDate)) applyBlock = <p className="muted">{t.notEligibleAge}</p>;
  else if (isMinor(p.birthDate) && (!p.guardianConsentAt || trial.recruiter.recruiter?.verification !== "VERIFIED")) applyBlock = <p className="muted">{t.minorNotAllowed}</p>;
  else
    applyBlock = (
      <form action={applyTrialAction} className="space-y-3">
        <input type="hidden" name="trialId" value={trial.id} />
        <textarea name="message" maxLength={1000} className="input" placeholder={t.applyMessage} />
        <SubmitButton pendingLabel={m.common.wait}>{t.apply}</SubmitButton>
      </form>
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/detections" className="link text-sm">← {m.nav.trials}</Link>
      <Flash sp={sp} />
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">{t.freeBadge}</Badge>
          <Badge>{t.ages(trial.minAge, trial.maxAge)}</Badge>
          {trial.recruiter.recruiter?.verification === "VERIFIED" && <Badge tone="blue">{m.labels.recruiterVerified}</Badge>}
        </div>
        <h1 className="h1">{trial.title}</h1>
        <p>📅 {formatDate(trial.startsAt, locale, { dateStyle: "full", timeStyle: "short" })}</p>
        <p>📍 {trial.address ? `${trial.address}, ` : ""}{trial.city}, {countryName(trial.country, locale)}</p>
        <dl className="grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="font-semibold text-gray-600">{t.fee}</dt>
          <dd className="font-semibold text-pitch-700">{t.feeFree}</dd>
          {trial.conditions && (
            <>
              <dt className="font-semibold text-gray-600">{t.conditions}</dt>
              <dd className="whitespace-pre-line" dir="auto">{trial.conditions}</dd>
            </>
          )}
        </dl>
        <p className="muted">{t.deadline(formatDate(trial.deadline, locale))}</p>
        {trial.positions.length > 0 && <p className="text-sm">{trial.positions.map((c) => positionLabel(m, c)).join(" · ")}</p>}
        <p className="whitespace-pre-line text-gray-700" dir="auto">{trial.description}</p>
        <p className="text-sm text-gray-600">{t.organizer} : <b>{trial.recruiter.recruiter?.organization}</b> ({trial.recruiter.recruiter ? m.labels.recruiterTypes[trial.recruiter.recruiter.type] : ""})</p>
        {trial.latitude != null && trial.longitude != null ? (
          <div className="space-y-2">
            <TrialsMap
              height={260}
              text={{ ...t.map }}
              trials={[{ id: trial.id, title: trial.title, lat: trial.latitude, lng: trial.longitude, when: formatDate(trial.startsAt, locale, { dateStyle: "medium", timeStyle: "short" }), place: `${trial.city}, ${countryName(trial.country, locale)}`, org: trial.recruiter.recruiter?.organization ?? "" }]}
            />
            <a href={directionsUrl(trial.latitude, trial.longitude)} target="_blank" rel="noopener" className="btn-secondary btn-sm">🧭 {t.map.directions}</a>
          </div>
        ) : (
          <p className="text-xs text-gray-500">{t.notOnMap}</p>
        )}
      </div>

      {!owner && <div className="card">{applyBlock}</div>}

      {owner && (
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h2">{t.applicantsTitle} ({applications.length})</h2>
            <form action={deleteTrialAction}><input type="hidden" name="id" value={trial.id} /><button className="btn-secondary btn-sm">{t.deleteTrial}</button></form>
          </div>
          {applications.length === 0 ? <p className="muted">{t.noApplicants}</p> : (
            <ul className="divide-y divide-gray-100">
              {applications.map((a) => {
                const pl = a.playerUser.player;
                return (
                  <li key={a.id} className="space-y-2 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {pl ? <Link className="link" href={`/joueurs/${pl.slug}`}>{pl.firstName} {pl.lastName}</Link> : a.playerUser.name}
                        {pl && <> · {positionLabel(m, pl.mainPosition)} · {m.common.years(ageOn(pl.birthDate))}</>}
                      </span>
                      <Badge tone={a.status === "INVITED" ? "green" : a.status === "DECLINED" ? "red" : a.status === "SHORTLISTED" ? "gold" : "gray"}>{m.labels.appStatus[a.status]}</Badge>
                    </div>
                    {a.message && <p className="text-gray-600" dir="auto">“{a.message}”</p>}
                    <div className="flex flex-wrap gap-2">
                      {(["SHORTLISTED", "INVITED", "DECLINED"] as const).map((s) => (
                        <form key={s} action={setApplicationStatusAction}>
                          <input type="hidden" name="id" value={a.id} /><input type="hidden" name="status" value={s} />
                          <button className={s === "INVITED" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{t.setStatus[s]}</button>
                        </form>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
