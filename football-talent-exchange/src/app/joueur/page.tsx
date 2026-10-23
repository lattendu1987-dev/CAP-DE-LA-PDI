import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { completeness } from "@/lib/domain/completeness";
import { isMinor } from "@/lib/domain/age";
import { isPremiumPlayer } from "@/lib/domain/rules";
import { AVAILABILITY_LABELS, LEVELS, positionLabel, levelLabel } from "@/lib/domain/reference";
import { formatTimestamp } from "@/lib/domain/video";
import { Badge, Field, Flash, Progress, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PositionPicker } from "@/components/position-picker";
import { CountrySelect } from "@/components/country-select";
import {
  addCareerAction, addStatAction, addVideoAction, deleteCareerAction, deleteStatAction, deleteVideoAction, togglePublishedAction, updateProfileAction,
} from "@/app/actions/player";

export const metadata = { title: "Mon profil joueur" };

const KIND_LABELS: Record<string, string> = {
  CLUB: "Club", ACADEMY: "Académie / centre de formation", NATIONAL_TEAM: "Sélection nationale", REGIONAL_TEAM: "Sélection régionale", UNIVERSITY: "Université",
};

export default async function PlayerHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["PLAYER"]);
  const sp = await searchParams;
  const p = await db.playerProfile.findUniqueOrThrow({
    where: { userId: user.id },
    include: {
      career: { orderBy: { startYear: "desc" } },
      stats: { orderBy: { season: "desc" } },
      videos: { include: { moments: { orderBy: { seconds: "asc" } } }, orderBy: { createdAt: "desc" } },
    },
  });
  const premium = isPremiumPlayer(user.subscription);
  const since = new Date(Date.now() - 30 * 86400000);
  const [views30, recruiterViews] = premium
    ? await Promise.all([
        db.profileView.count({ where: { playerId: p.id, createdAt: { gte: since } } }),
        db.profileView.findMany({ where: { playerId: p.id, createdAt: { gte: since }, viewerId: { not: null } }, distinct: ["viewerId"], take: 10, orderBy: { createdAt: "desc" } }),
      ])
    : [0, []];
  const viewers = premium && recruiterViews.length
    ? await db.recruiterProfile.findMany({ where: { userId: { in: recruiterViews.map((v) => v.viewerId!) } }, select: { organization: true, type: true } })
    : [];

  const c = completeness({ ...p, careerCount: p.career.length, statsCount: p.stats.length, videoCount: p.videos.length, momentCount: p.videos.reduce((a, v) => a + v.moments.length, 0) });
  const minor = isMinor(p.birthDate);
  const pendingConsent = minor && !p.guardianConsentAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Bonjour {p.firstName} 👋</h1>
          <p className="muted">Ton CV football, visible par les recruteurs du monde entier.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="btn-secondary" href={`/joueurs/${p.slug}`}>Voir mon profil public</Link>
          <Link className="btn-secondary" href={`/joueurs/${p.slug}/cv`}>Fiche PDF</Link>
        </div>
      </div>
      <Flash sp={sp} />

      {pendingConsent && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>Profil en attente de l&apos;accord de ton parent ou tuteur</b> ({p.guardianEmail}). Tant qu&apos;il n&apos;a pas confirmé, les recruteurs ne peuvent pas voir ton profil. Tu peux déjà le compléter.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="card md:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="h2">Profil complété à {c.score} %</h2>
            {p.published ? <Badge tone="green">Visible</Badge> : <Badge tone="red">Masqué</Badge>}
          </div>
          <div className="mt-3"><Progress value={c.score} /></div>
          {c.tips.length > 0 && (
            <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              {c.tips.slice(0, 4).map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          <form action={togglePublishedAction} className="mt-4">
            <button className="btn-secondary btn-sm">{p.published ? "Masquer mon profil" : "Rendre mon profil visible"}</button>
          </form>
        </div>
        <div className="card">
          <h2 className="h2">Audience (30 jours)</h2>
          {premium ? (
            <>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Stat label="Vues" value={views30} />
                <Stat label="Recruteurs" value={recruiterViews.length} />
              </div>
              {viewers.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-gray-700">{viewers.map((v, i) => <li key={i}>👀 {v.organization}</li>)}</ul>
              )}
            </>
          ) : (
            <p className="muted mt-2">Découvre quels clubs consultent ton profil avec <Link className="link" href="/abonnement">Premium</Link>.</p>
          )}
        </div>
      </div>

      <section id="infos" className="card">
        <h2 className="h2 mb-4">Informations</h2>
        <form action={updateProfileAction} className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <Field label="Prénom"><input className="input" name="firstName" defaultValue={p.firstName} required /></Field>
            <Field label="Nom"><input className="input" name="lastName" defaultValue={p.lastName} required /></Field>
            <Field label="Pays de résidence"><CountrySelect name="country" defaultValue={p.country} /></Field>
            <Field label="Ville"><input className="input" name="city" defaultValue={p.city ?? ""} /></Field>
            <Field label="Nationalité(s)" hint="Codes pays séparés par des virgules, ex. CA, HT"><input className="input" name="nationalities" defaultValue={p.nationalities.join(", ")} /></Field>
            <Field label="Langues parlées" hint="Ex. français, anglais, créole"><input className="input" name="languages" defaultValue={p.languages.join(", ")} /></Field>
            <Field label="Taille (cm)"><input className="input" type="number" name="heightCm" min={120} max={230} defaultValue={p.heightCm ?? ""} /></Field>
            <Field label="Poids (kg)"><input className="input" type="number" name="weightKg" min={35} max={150} defaultValue={p.weightKg ?? ""} /></Field>
            <Field label="Pied fort">
              <select className="input" name="foot" defaultValue={p.foot ?? ""}>
                <option value="">—</option><option value="RIGHT">Droit</option><option value="LEFT">Gauche</option><option value="BOTH">Ambidextre</option>
              </select>
            </Field>
            <Field label="Niveau actuel">
              <select className="input" name="currentLevel" defaultValue={p.currentLevel ?? ""}>
                <option value="">—</option>
                {LEVELS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
              </select>
            </Field>
            <Field label="Statut contractuel">
              <select className="input" name="contractStatus" defaultValue={p.contractStatus}>
                <option value="FREE">Libre de tout contrat</option><option value="UNDER_CONTRACT">Sous contrat</option>
              </select>
            </Field>
            <Field label="Fin de contrat (si sous contrat)"><input className="input" type="date" name="contractEnd" defaultValue={p.contractEnd?.toISOString().slice(0, 10) ?? ""} /></Field>
            <Field label="Disponibilité">
              <select className="input" name="availability" defaultValue={p.availability}>
                {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="Pays où tu accepterais de jouer" hint="Codes pays, ex. FR, BE, US"><input className="input" name="relocationCountries" defaultValue={p.relocationCountries.join(", ")} /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="hasAgent" defaultChecked={p.hasAgent} /> J&apos;ai un agent</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="willingToRelocate" defaultChecked={p.willingToRelocate} /> Prêt à déménager</label>
            <div className="sm:col-span-2"><Field label="Photo (lien https)"><input className="input" name="photoUrl" type="url" defaultValue={p.photoUrl ?? ""} placeholder="https://…" /></Field></div>
            <div className="sm:col-span-2">
              <Field label="Présentation" hint="Ton style de jeu, tes qualités, tes objectifs."><textarea className="input min-h-28" name="bio" maxLength={1500} defaultValue={p.bio ?? ""} /></Field>
            </div>
          </div>
          <div>
            <span className="label">Postes</span>
            <PositionPicker main={p.mainPosition} others={p.otherPositions} />
          </div>
          <div className="lg:col-span-2"><SubmitButton>Enregistrer</SubmitButton></div>
        </form>
      </section>

      <section id="videos" className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="h2">Vidéos</h2>
          {!premium && <span className="muted">Gratuit : 1 vidéo · <Link className="link" href="/abonnement">Premium : illimité</Link></span>}
        </div>
        <ul className="mb-5 space-y-3">
          {p.videos.map((v) => (
            <li key={v.id} className="flex items-start justify-between gap-3 rounded-xl bg-gray-50 p-3">
              <div className="min-w-0">
                <p className="font-semibold">{v.title} <Badge>{v.kind === "FULL_MATCH" ? "Match complet" : "Highlights"}</Badge></p>
                <p className="muted truncate">{v.url}</p>
                {v.moments.length > 0 && <p className="mt-1 text-xs text-gray-600">{v.moments.map((m) => `${formatTimestamp(m.seconds)} ${m.label}`).join(" · ")}</p>}
              </div>
              <form action={deleteVideoAction}><input type="hidden" name="id" value={v.id} /><button className="btn-secondary btn-sm">Supprimer</button></form>
            </li>
          ))}
        </ul>
        <form action={addVideoAction} className="grid gap-4 sm:grid-cols-2">
          <Field label="Lien de la vidéo" hint="YouTube, Vimeo ou fichier .mp4 (https)"><input className="input" name="url" type="url" required /></Field>
          <Field label="Titre"><input className="input" name="title" placeholder="Highlights saison 2025" /></Field>
          <Field label="Type">
            <select className="input" name="kind"><option value="HIGHLIGHTS">Meilleures actions</option><option value="FULL_MATCH">Match complet</option></select>
          </Field>
          <Field label="Moments clés (un par ligne)" hint="Ex. 01:12 But du pied gauche"><textarea className="input min-h-24 font-mono" name="moments" placeholder={"00:45 Dribble et centre\n01:12 But du pied gauche"} /></Field>
          <div className="sm:col-span-2"><SubmitButton>Ajouter la vidéo</SubmitButton></div>
        </form>
      </section>

      <section id="parcours" className="card">
        <h2 className="h2 mb-4">Parcours</h2>
        <ul className="mb-5 space-y-2">
          {p.career.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm">
              <span><b>{e.club}</b> · {KIND_LABELS[e.kind] ?? e.kind} · {e.startYear}–{e.endYear ?? "auj."}{e.level ? ` · ${levelLabel(e.level)}` : ""}</span>
              <form action={deleteCareerAction}><input type="hidden" name="id" value={e.id} /><button className="btn-secondary btn-sm">Supprimer</button></form>
            </li>
          ))}
        </ul>
        <form action={addCareerAction} className="grid gap-4 sm:grid-cols-3">
          <Field label="Club / académie / sélection"><input className="input" name="club" required /></Field>
          <Field label="Type">
            <select className="input" name="kind">{Object.entries(KIND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          </Field>
          <Field label="Niveau">
            <select className="input" name="level"><option value="">—</option>{LEVELS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}</select>
          </Field>
          <Field label="Pays"><CountrySelect name="country" defaultValue={p.country} /></Field>
          <Field label="Année de début"><input className="input" type="number" name="startYear" required min={1990} max={2100} /></Field>
          <Field label="Année de fin" hint="Vide si en cours"><input className="input" type="number" name="endYear" min={1990} max={2100} /></Field>
          <div className="sm:col-span-3"><SubmitButton>Ajouter au parcours</SubmitButton></div>
        </form>
      </section>

      <section id="stats" className="card">
        <h2 className="h2 mb-4">Statistiques</h2>
        {p.stats.length > 0 && (
          <div className="mb-5 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-gray-500">
                <tr><th className="py-2">Saison</th><th>Club</th><th>MJ</th><th>Min</th><th>Buts</th><th>PD</th>{p.mainPosition === "GB" && <><th>CS</th><th>Arrêts</th></>}<th>Statut</th><th /></tr>
              </thead>
              <tbody>
                {p.stats.map((s) => (
                  <tr key={s.id} className="border-t border-gray-100">
                    <td className="py-2 font-semibold">{s.season}</td><td>{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td><td>{s.goals}</td><td>{s.assists}</td>
                    {p.mainPosition === "GB" && <><td>{s.cleanSheets}</td><td>{s.saves}</td></>}
                    <td>{s.verified ? <Badge tone="blue">✓ Vérifiée</Badge> : <Badge>Déclarée</Badge>}</td>
                    <td><form action={deleteStatAction}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-red-600 hover:underline">Supprimer</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form action={addStatAction} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Saison"><input className="input" name="season" placeholder="2025-26" required /></Field>
          <div className="col-span-1 sm:col-span-3"><Field label="Club"><input className="input" name="club" required /></Field></div>
          {[["matches", "Matchs"], ["minutes", "Minutes"], ["goals", "Buts"], ["assists", "Passes déc."], ["yellowCards", "Cartons jaunes"], ["redCards", "Cartons rouges"], ["cleanSheets", "Clean sheets (GB)"], ["saves", "Arrêts (GB)"]].map(([k, l]) => (
            <Field key={k} label={l}><input className="input" type="number" min={0} name={k} /></Field>
          ))}
          <div className="col-span-2 sm:col-span-4"><SubmitButton>Ajouter la saison</SubmitButton></div>
        </form>
      </section>

      <p className="muted">Poste principal actuel : {positionLabel(p.mainPosition)}.</p>
    </div>
  );
}
