import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate } from "@/i18n/format";
import type { Messages } from "@/i18n/messages";
import { completeness } from "@/lib/domain/completeness";
import { isMinor } from "@/lib/domain/age";
import { isPremiumPlayer } from "@/lib/domain/rules";
import { AVAILABILITY_CODES, CAREER_KINDS, LEVEL_CODES, levelLabel } from "@/lib/domain/reference";
import { formatTimestamp } from "@/lib/domain/video";
import { appUrl } from "@/lib/email";
import { Avatar, Badge, Field, Flash, Progress, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PositionPicker } from "@/components/position-picker";
import { CountrySelect } from "@/components/country-select";
import { UploadField } from "@/components/upload-field";
import { autosaveText, uploadText } from "@/lib/ui-text";
import { FormAutosave } from "@/components/form-autosave";
import { ShareButtons } from "@/components/share";
import { PushBanner } from "@/components/push-banner";
import {
  addCareerAction, addStatAction, addVideoAction, deleteCareerAction, deleteStatAction, deleteVideoAction, setPhotoAction, togglePublishedAction, updateProfileAction,
} from "@/app/actions/player";

export async function generateMetadata() {
  return { title: (await getMessages()).player.metaTitle };
}

function VideoMetaFields({ m }: { m: Messages }) {
  const p = m.player;
  return (
    <>
      <Field label={p.videoTitle}><input className="input" name="title" placeholder={p.videoTitlePlaceholder} /></Field>
      <Field label={p.videoKind}>
        <select className="input" name="kind"><option value="HIGHLIGHTS">{p.kindHighlights}</option><option value="FULL_MATCH">{p.kindFull}</option></select>
      </Field>
      <div className="sm:col-span-2">
        <Field label={p.moments} hint={p.momentsHint}><textarea className="input min-h-24 font-mono" name="moments" placeholder={"00:45 …\n01:12 …"} /></Field>
      </div>
    </>
  );
}

export default async function PlayerHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["PLAYER"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.player;
  const p = await db.playerProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      career: { orderBy: { startYear: "desc" } },
      stats: { orderBy: { season: "desc" } },
      videos: { include: { moments: { orderBy: { seconds: "asc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
  const applications = await db.trialApplication.findMany({ where: { playerUserId: user.id }, include: { trial: true }, orderBy: { createdAt: "desc" }, take: 20 });
  const premium = isPremiumPlayer(user.subscription);
  const since = new Date(Date.now() - 30 * 86400000);
  const [views30, recruiterViews] = premium
    ? await Promise.all([
        db.profileView.count({ where: { playerId: p.id, createdAt: { gte: since } } }),
        db.profileView.findMany({ where: { playerId: p.id, createdAt: { gte: since }, viewerId: { not: null } }, distinct: ["viewerId"], take: 10, orderBy: { createdAt: "desc" } }),
      ])
    : [0, []];
  const viewers = premium && recruiterViews.length
    ? await db.recruiterProfile.findMany({ where: { userId: { in: recruiterViews.map((v) => v.viewerId!) } }, select: { organization: true } })
    : [];

  const c = completeness({ ...p, careerCount: p.career.length, statsCount: p.stats.length, videoCount: p.videos.length, momentCount: p.videos.reduce((a, v) => a + v.moments.length, 0) });
  const pendingConsent = isMinor(p.birthDate) && !p.guardianConsentAt;
  const publicUrl = `${appUrl()}/joueurs/${p.slug}`;
  const gk = p.mainPosition === "GB";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">{t.hello(p.firstName)}</h1>
          <p className="muted">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/joueurs/${p.slug}`}>{t.viewPublic}</Link>
          <Link className="btn-secondary" href={`/joueurs/${p.slug}/cv`}>{t.pdf}</Link>
        </div>
      </div>
      <Flash sp={sp} />
      <PushBanner m={m} />

      {pendingConsent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>{t.pendingConsentTitle}</b> ({p.guardianEmail}). {t.pendingConsentText}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="h2">{t.completeness(c.score)}</h2>
            {p.published ? <Badge tone="green">{t.visible}</Badge> : <Badge tone="red">{t.hidden}</Badge>}
          </div>
          <div className="mt-3"><Progress value={c.score} /></div>
          {c.tips.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 ps-5 text-sm text-gray-700">
              {c.tips.slice(0, 4).map((k) => <li key={k}>{t.tips[k]}</li>)}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <form action={togglePublishedAction}><button className="btn-secondary btn-sm">{p.published ? t.hide : t.show}</button></form>
            {!pendingConsent && p.published && (
              <ShareButtons url={publicUrl} text={t.shareText(`${p.firstName} ${p.lastName}`, publicUrl)} labels={{ whatsapp: m.common.shareWhatsApp, copy: m.common.copy, copied: m.common.copied }} />
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="h2">{t.audience}</h2>
          {premium ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label={t.views} value={views30} />
                <Stat label={t.recruiters} value={recruiterViews.length} />
              </div>
              {viewers.length > 0 && <ul className="mt-3 space-y-1 text-sm text-gray-700">{viewers.map((v, i) => <li key={i}>👀 {v.organization}</li>)}</ul>}
            </>
          ) : (
            <p className="muted mt-2">{t.audienceUpsell} <Link className="link" href="/abonnement">Premium</Link>.</p>
          )}
        </div>
      </div>

      <section id="infos" className="card">
        <h2 className="h2 mb-4">{t.infoTitle}</h2>
        <div className="mb-6 grid items-center gap-4 sm:grid-cols-[auto_1fr]">
          <Avatar name={`${p.firstName} ${p.lastName}`} url={p.photoUrl} size={88} />
          <form action={setPhotoAction} className="space-y-2">
            <span className="label">{t.photo}</span>
            <UploadField kind="photo" text={uploadText(m, "photo")} />
            <SubmitButton className="btn-secondary btn-sm">{m.common.save}</SubmitButton>
          </form>
        </div>
        <form action={updateProfileAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="lg:col-span-2"><FormAutosave id={`profile-${p.id}`} text={autosaveText(m)} /></div>
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Field label={m.auth.firstName}><input className="input" name="firstName" defaultValue={p.firstName} required /></Field>
            <Field label={m.auth.lastName}><input className="input" name="lastName" defaultValue={p.lastName} required /></Field>
            <Field label={m.auth.country}><CountrySelect name="country" locale={locale} defaultValue={p.country} /></Field>
            <Field label={t.city}><input className="input" name="city" defaultValue={p.city ?? ""} /></Field>
            <Field label={t.nationalities} hint={t.nationalitiesHint}><input className="input" name="nationalities" defaultValue={p.nationalities.join(", ")} /></Field>
            <Field label={t.languages} hint={t.languagesHint}><input className="input" name="languages" defaultValue={p.languages.join(", ")} /></Field>
            <Field label={t.height}><input className="input" type="number" name="heightCm" min={120} max={230} defaultValue={p.heightCm ?? ""} /></Field>
            <Field label={t.weight}><input className="input" type="number" name="weightKg" min={35} max={150} defaultValue={p.weightKg ?? ""} /></Field>
            <Field label={t.foot}>
              <select className="input" name="foot" defaultValue={p.foot ?? ""}>
                <option value="">—</option>
                {(["RIGHT", "LEFT", "BOTH"] as const).map((f) => <option key={f} value={f}>{m.labels.foot[f]}</option>)}
              </select>
            </Field>
            <Field label={t.level}>
              <select className="input" name="currentLevel" defaultValue={p.currentLevel ?? ""}>
                <option value="">—</option>
                {LEVEL_CODES.map((l) => <option key={l} value={l}>{m.labels.levels[l]}</option>)}
              </select>
            </Field>
            <Field label={t.contract}>
              <select className="input" name="contractStatus" defaultValue={p.contractStatus}>
                <option value="FREE">{t.contractFree}</option><option value="UNDER_CONTRACT">{t.contractUnder}</option>
              </select>
            </Field>
            <Field label={t.contractEnd}><input className="input" type="date" name="contractEnd" defaultValue={p.contractEnd?.toISOString().slice(0, 10) ?? ""} /></Field>
            <Field label={t.availability}>
              <select className="input" name="availability" defaultValue={p.availability}>
                {AVAILABILITY_CODES.map((k) => <option key={k} value={k}>{m.labels.availability[k]}</option>)}
              </select>
            </Field>
            <Field label={t.relocationCountries} hint={t.relocationHint}><input className="input" name="relocationCountries" defaultValue={p.relocationCountries.join(", ")} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hasAgent" defaultChecked={p.hasAgent} /> {t.hasAgent}</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="willingToRelocate" defaultChecked={p.willingToRelocate} /> {t.relocate}</label>
            <div className="sm:col-span-2">
              <Field label={t.bio} hint={t.bioHint}><textarea className="input min-h-28" name="bio" maxLength={1500} defaultValue={p.bio ?? ""} /></Field>
            </div>
          </div>
          <div>
            <span className="label">{t.positions}</span>
            <PositionPicker
              main={p.mainPosition}
              others={p.otherPositions}
              text={{ help: t.positionsHelp, mainLabel: t.mainPosition, otherLabel: t.otherPositions, none: m.common.none, labels: m.labels.positions }}
            />
          </div>
          <div className="lg:col-span-2"><SubmitButton pendingLabel={m.common.wait}>{m.common.save}</SubmitButton></div>
        </form>
      </section>

      <section id="videos" className="card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{t.videosTitle}</h2>
          {!premium && <span className="muted">{t.videoLimitFree} <Link className="link" href="/abonnement">{t.videoLimitPremium}</Link></span>}
        </div>
        <ul className="mb-5 space-y-3">
          {p.videos.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-3">
              <div className="min-w-0">
                <p className="font-semibold">{v.title} <Badge>{m.labels.videoKinds[v.kind as "HIGHLIGHTS" | "FULL_MATCH"]}</Badge> {v.storageKey && <Badge tone="green">📱</Badge>}</p>
                {!v.storageKey && <p className="muted truncate">{v.url}</p>}
                {v.moments.length > 0 && <p className="mt-1 text-xs text-gray-600">{v.moments.map((x) => `${formatTimestamp(x.seconds)} ${x.label}`).join(" · ")}</p>}
              </div>
              <form action={deleteVideoAction}><input type="hidden" name="id" value={v.id} /><button className="btn-secondary btn-sm">{m.common.delete}</button></form>
            </li>
          ))}
        </ul>
        <details open className="rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-semibold">{t.uploadTab}</summary>
          <form action={addVideoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><UploadField kind="video" text={uploadText(m, "video")} /></div>
            <VideoMetaFields m={m} />
            <div className="sm:col-span-2"><SubmitButton pendingLabel={m.common.wait}>{t.addVideo}</SubmitButton></div>
          </form>
        </details>
        <details className="mt-3 rounded-xl border border-gray-200 p-4">
          <summary className="cursor-pointer font-semibold">{t.linkTab}</summary>
          <form action={addVideoAction} className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Field label={t.videoUrl} hint={t.videoUrlHint}><input className="input" name="url" type="url" required /></Field></div>
            <VideoMetaFields m={m} />
            <div className="sm:col-span-2"><SubmitButton pendingLabel={m.common.wait}>{t.addVideo}</SubmitButton></div>
          </form>
        </details>
      </section>

      <section id="candidatures" className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h2">{t.applicationsTitle}</h2>
          <Link className="link text-sm" href="/detections">{m.nav.trials} →</Link>
        </div>
        {applications.length === 0 ? <p className="muted">{t.noApplications}</p> : (
          <ul className="space-y-2 text-sm">
            {applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-gray-50 p-3">
                <span><Link className="link" href={`/detections/${a.trialId}`}>{a.trial.title}</Link> · {formatDate(a.trial.startsAt, locale)}</span>
                <Badge tone={a.status === "INVITED" ? "green" : a.status === "DECLINED" ? "red" : a.status === "SHORTLISTED" ? "gold" : "gray"}>{m.labels.appStatus[a.status]}</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="parcours" className="card">
        <h2 className="h2 mb-4">{t.careerTitle}</h2>
        <ul className="mb-5 space-y-2">
          {p.career.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
              <span><b>{e.club}</b> · {m.labels.careerKinds[e.kind as (typeof CAREER_KINDS)[number]] ?? e.kind} · {e.startYear}–{e.endYear ?? m.common.today}{e.level ? ` · ${levelLabel(m, e.level)}` : ""}</span>
              <form action={deleteCareerAction}><input type="hidden" name="id" value={e.id} /><button className="btn-secondary btn-sm">{m.common.delete}</button></form>
            </li>
          ))}
        </ul>
        <form action={addCareerAction} className="grid gap-4 sm:grid-cols-3">
          <Field label={t.careerClub}><input className="input" name="club" required /></Field>
          <Field label={t.careerKind}>
            <select className="input" name="kind">{CAREER_KINDS.map((k) => <option key={k} value={k}>{m.labels.careerKinds[k]}</option>)}</select>
          </Field>
          <Field label={t.careerLevel}>
            <select className="input" name="level"><option value="">—</option>{LEVEL_CODES.map((l) => <option key={l} value={l}>{m.labels.levels[l]}</option>)}</select>
          </Field>
          <Field label={t.careerCountry}><CountrySelect name="country" locale={locale} defaultValue={p.country} /></Field>
          <Field label={t.startYear}><input className="input" type="number" name="startYear" required min={1990} max={2100} /></Field>
          <Field label={t.endYear} hint={t.endYearHint}><input className="input" type="number" name="endYear" min={1990} max={2100} /></Field>
          <div className="sm:col-span-3"><SubmitButton pendingLabel={m.common.wait}>{t.addCareer}</SubmitButton></div>
        </form>
      </section>

      <section id="stats" className="card">
        <h2 className="h2 mb-4">{t.statsTitle}</h2>
        {p.stats.length > 0 && (
          <div className="mb-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-start text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr>
                  <th className="py-2 text-start">{t.season}</th><th className="text-start">{t.club}</th><th>{t.statsHead.matches}</th><th>{t.statsHead.minutes}</th><th>{t.statsHead.goals}</th><th>{t.statsHead.assists}</th>
                  {gk && <><th>{t.statsHead.cleanSheets}</th><th>{t.statsHead.saves}</th></>}<th>{t.statsHead.status}</th><th />
                </tr>
              </thead>
              <tbody>
                {p.stats.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100 text-center">
                    <td className="py-2 text-start font-semibold">{s.season}</td><td className="text-start">{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td><td>{s.goals}</td><td>{s.assists}</td>
                    {gk && <><td>{s.cleanSheets}</td><td>{s.saves}</td></>}
                    <td>{s.verified ? <Badge tone="blue">{m.labels.verified}</Badge> : <Badge>{m.labels.declared}</Badge>}</td>
                    <td><form action={deleteStatAction}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-red-600 hover:underline">{m.common.delete}</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={addStatAction} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label={t.season}><input className="input" name="season" placeholder="2025-26" required /></Field>
          <div className="col-span-1 sm:col-span-3"><Field label={t.club}><input className="input" name="club" required /></Field></div>
          {(Object.keys(t.statLabels) as (keyof typeof t.statLabels)[]).map((k) => (
            <Field key={k} label={t.statLabels[k]}><input className="input" type="number" min={0} name={k} /></Field>
          ))}
          <div className="col-span-2 sm:col-span-4"><SubmitButton pendingLabel={m.common.wait}>{t.addSeason}</SubmitButton></div>
        </form>
      </section>
    </div>
  );
}
