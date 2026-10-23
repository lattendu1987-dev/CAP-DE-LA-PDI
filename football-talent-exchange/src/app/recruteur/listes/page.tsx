import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { PlayerCard } from "@/components/player-card";
import { Empty, Flash } from "@/components/ui";
import { deleteSavedSearchAction, deleteShortlistAction, removeFromShortlistAction } from "@/app/actions/recruiter";

export const metadata = { title: "Mes listes" };

export default async function ListsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["RECRUITER"]);
  const sp = await searchParams;
  const rid = user.recruiter!.id;
  const [lists, searches, evaluations] = await Promise.all([
    db.shortlist.findMany({ where: { recruiterId: rid }, include: { items: { include: { player: true }, orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "asc" } }),
    db.savedSearch.findMany({ where: { recruiterId: rid }, orderBy: { createdAt: "desc" } }),
    db.evaluation.findMany({ where: { recruiterId: rid }, include: { player: true }, orderBy: { updatedAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="h1">Mes listes</h1>
      <Flash sp={sp} />
      {lists.length === 0 && <Empty>Ajoute des joueurs à une liste depuis leur profil.</Empty>}
      {lists.map((l) => (
        <section key={l.id} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h2">{l.name} <span className="muted">({l.items.length})</span></h2>
            <div className="flex gap-2">
              {l.items.length >= 2 && <Link className="btn-secondary btn-sm" href={`/recruteur/comparer?${l.items.slice(0, 4).map((i) => `ids=${i.player.slug}`).join("&")}`}>Comparer</Link>}
              <form action={deleteShortlistAction}><input type="hidden" name="id" value={l.id} /><button className="btn-secondary btn-sm">Supprimer la liste</button></form>
            </div>
          </div>
          {l.items.map((i) => (
            <PlayerCard key={i.id} p={i.player} action={<form action={removeFromShortlistAction}><input type="hidden" name="id" value={i.id} /><button className="text-xs text-red-600 hover:underline">Retirer</button></form>} />
          ))}
        </section>
      ))}

      <section className="card">
        <h2 className="h2 mb-3">Recherches sauvegardées (alertes)</h2>
        {searches.length === 0 ? <p className="muted">Aucune. Sauvegarde une recherche depuis la page Recherche.</p> : (
          <ul className="space-y-2">
            {searches.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <Link className="link" href={`/recruteur/recherche?${s.query}`}>{s.name}</Link>
                <form action={deleteSavedSearchAction}><input type="hidden" name="id" value={s.id} /><button className="text-xs text-red-600 hover:underline">Supprimer</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Mes évaluations récentes</h2>
        {evaluations.length === 0 ? <p className="muted">Aucune évaluation.</p> : (
          <ul className="space-y-2 text-sm">
            {evaluations.map((e) => (
              <li key={e.id}>
                <Link className="link" href={`/joueurs/${e.player.slug}`}>{e.player.firstName} {e.player.lastName}</Link> — Tech {e.technical} · Phys {e.physical} · Tact {e.tactical} · Mental {e.mental}
                {" "}· <b>{((e.technical + e.physical + e.tactical + e.mental) / 4).toFixed(1)}/10</b>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
