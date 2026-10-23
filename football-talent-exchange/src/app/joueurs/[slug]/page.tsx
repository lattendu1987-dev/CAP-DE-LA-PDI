import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { canView, loadPlayerBySlug } from "@/lib/players";
import { ageOn, isMinor } from "@/lib/domain/age";
import { isPremiumPlayer } from "@/lib/domain/rules";
import { AVAILABILITY_LABELS, countryName, FOOT_LABELS, levelLabel, positionLabel } from "@/lib/domain/reference";
import { Avatar, Badge, Field, Flash, Stat } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { SubmitButton } from "@/components/submit-button";
import { addToShortlistAction, saveEvaluationAction, startConversationAction } from "@/app/actions/recruiter";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, null)) return { title: "Profil joueur", robots: { index: false } };
  return {
    title: `${p.firstName} ${p.lastName} — ${positionLabel(p.mainPosition)}`,
    description: `${positionLabel(p.mainPosition)}, ${ageOn(p.birthDate)} ans, ${countryName(p.country)}. Vidéos, parcours et statistiques.`,
  };
}

export default async function PlayerPublicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const viewer = await getCurrentUser();
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, viewer)) notFound();

  const isRecruiter = viewer?.role === "RECRUITER" && viewer.recruiter;
  if (viewer?.id !== p.userId) {
    await db.profileView.create({ data: { playerId: p.id, viewerId: isRecruiter ? viewer!.id : null } });
  }
  const [shortlists, evaluation] = isRecruiter
    ? await Promise.all([
        db.shortlist.findMany({ where: { recruiterId: viewer!.recruiter!.id }, orderBy: { createdAt: "asc" } }),
        db.evaluation.findUnique({ where: { recruiterId_playerId: { recruiterId: viewer!.recruiter!.id, playerId: p.id } } }),
      ])
    : [[], null];

  const name = `${p.firstName} ${p.lastName}`;
  const age = ageOn(p.birthDate);
  const totals = p.stats.reduce((a, s) => ({ m: a.m + s.matches, g: a.g + s.goals, a: a.a + s.assists, cs: a.cs + s.cleanSheets }), { m: 0, g: 0, a: 0, cs: 0 });
  const gk = p.mainPosition === "GB";

  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="card flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar name={name} url={p.photoUrl} size={96} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h1">{name}</h1>
            {isPremiumPlayer(p.user.subscription) && <Badge tone="gold">★ Premium</Badge>}
            {isMinor(p.birthDate) && <Badge tone="blue">Mineur · représentant légal informé</Badge>}
          </div>
          <p className="mt-1 text-gray-700">
            <b>{positionLabel(p.mainPosition)}</b>
            {p.otherPositions.length > 0 && <> · aussi {p.otherPositions.map(positionLabel).join(", ")}</>}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.contractStatus === "FREE" ? <Badge tone="green">Libre de contrat</Badge> : <Badge>Sous contrat{p.contractEnd ? ` jusqu'au ${p.contractEnd.toLocaleDateString("fr-CA")}` : ""}</Badge>}
            <Badge>{AVAILABILITY_LABELS[p.availability]}</Badge>
            {p.hasAgent ? <Badge>Avec agent</Badge> : <Badge>Sans agent</Badge>}
            {p.willingToRelocate && <Badge tone="green">Prêt à déménager</Badge>}
          </div>
        </div>
        <div className="no-print flex flex-col gap-2">
          <Link href={`/joueurs/${p.slug}/cv`} className="btn-secondary btn-sm">Fiche PDF</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Stat label="Âge" value={`${age} ans`} />
        <Stat label="Taille" value={p.heightCm ? `${p.heightCm} cm` : "—"} />
        <Stat label="Poids" value={p.weightKg ? `${p.weightKg} kg` : "—"} />
        <Stat label="Pied fort" value={p.foot ? FOOT_LABELS[p.foot] : "—"} />
        <Stat label="Pays" value={countryName(p.country)} />
        <Stat label="Niveau" value={<span className="text-sm">{levelLabel(p.currentLevel)}</span>} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {p.bio && (
            <section className="card"><h2 className="h2 mb-2">Présentation</h2><p className="whitespace-pre-line text-gray-700">{p.bio}</p></section>
          )}
          <section className="card">
            <h2 className="h2 mb-4">Vidéos</h2>
            {p.videos.length === 0 ? <p className="muted">Aucune vidéo pour l&apos;instant.</p> : (
              <div className="space-y-6">
                {p.videos.map((v) => (
                  <div key={v.id}>
                    <p className="mb-2 font-semibold">{v.title} <Badge>{v.kind === "FULL_MATCH" ? "Match complet" : "Highlights"}</Badge></p>
                    <VideoPlayer url={v.url} title={v.title} moments={v.moments} />
                  </div>
                ))}
              </div>
            )}
          </section>
          <section className="card">
            <h2 className="h2 mb-4">Statistiques</h2>
            {p.stats.length === 0 ? <p className="muted">Aucune statistique renseignée.</p> : (
              <>
                <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  <Stat label="Matchs" value={totals.m} />
                  {gk ? <Stat label="Clean sheets" value={totals.cs} /> : <Stat label="Buts" value={totals.g} />}
                  <Stat label="Passes déc." value={totals.a} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="text-xs uppercase text-gray-500"><tr><th className="py-2">Saison</th><th>Club</th><th>MJ</th><th>Min</th>{gk ? <><th>CS</th><th>Arrêts</th></> : <><th>Buts</th><th>PD</th></>}<th /></tr></thead>
                    <tbody>
                      {p.stats.map((s) => (
                        <tr key={s.id} className="border-t border-gray-100">
                          <td className="py-2 font-semibold">{s.season}</td><td>{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td>
                          {gk ? <><td>{s.cleanSheets}</td><td>{s.saves}</td></> : <><td>{s.goals}</td><td>{s.assists}</td></>}
                          <td>{s.verified ? <Badge tone="blue">✓ Vérifiée</Badge> : <Badge>Déclarée</Badge>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
          <section className="card">
            <h2 className="h2 mb-4">Parcours</h2>
            {p.career.length === 0 ? <p className="muted">Parcours non renseigné.</p> : (
              <ol className="relative space-y-4 border-l-2 border-pitch-100 pl-5">
                {p.career.map((e) => (
                  <li key={e.id}>
                    <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-pitch-500" />
                    <p className="font-semibold">{e.club}</p>
                    <p className="muted">{e.startYear}–{e.endYear ?? "aujourd'hui"} · {levelLabel(e.level)}{e.country ? ` · ${countryName(e.country)}` : ""}</p>
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
                <h2 className="h2">Contacter {p.firstName}</h2>
                {isMinor(p.birthDate) && <p className="text-xs text-gray-600">Joueur mineur : son représentant légal recevra aussi ce message.</p>}
                <input type="hidden" name="playerId" value={p.id} />
                <textarea name="body" required minLength={20} maxLength={3000} className="input min-h-28" placeholder="Présente ton club et ce que tu proposes (essai, détection…)." />
                <SubmitButton className="btn-primary w-full">Envoyer</SubmitButton>
              </form>
              <form action={addToShortlistAction} className="card space-y-3">
                <h2 className="h2">Ajouter à une liste</h2>
                <input type="hidden" name="playerId" value={p.id} />
                <select name="shortlistId" className="input">
                  {shortlists.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  <option value="">+ Nouvelle liste…</option>
                </select>
                <input name="newName" className="input" placeholder="Nom de la nouvelle liste" />
                <SubmitButton className="btn-secondary w-full">Ajouter</SubmitButton>
              </form>
              <form action={saveEvaluationAction} className="card space-y-3">
                <h2 className="h2">Mon évaluation</h2>
                <p className="text-xs text-gray-500">Privée : visible seulement par toi.</p>
                <input type="hidden" name="playerId" value={p.id} />
                {([["technical", "Technique"], ["physical", "Physique"], ["tactical", "Tactique"], ["mental", "Mental"]] as const).map(([k, l]) => (
                  <Field key={k} label={`${l} (1 à 10)`}>
                    <input className="w-full accent-pitch-600" type="range" min={1} max={10} name={k} defaultValue={evaluation?.[k] ?? 5} />
                  </Field>
                ))}
                <textarea name="comment" className="input" maxLength={2000} defaultValue={evaluation?.comment ?? ""} placeholder="Notes de scouting" />
                <SubmitButton className="btn-secondary w-full">Enregistrer</SubmitButton>
              </form>
            </>
          ) : !viewer ? (
            <div className="card">
              <h2 className="h2">Tu recrutes ?</h2>
              <p className="muted mt-1">Crée un compte recruteur pour contacter ce joueur directement.</p>
              <Link href="/inscription?role=recruteur" className="btn-primary mt-3 w-full">Essai gratuit</Link>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
