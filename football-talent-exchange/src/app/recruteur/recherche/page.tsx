import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPlayerWhere, filtersToQueryString, parseFilters } from "@/lib/domain/search";
import { isPremiumPlayer, isSubscriptionActive } from "@/lib/domain/rules";
import { AVAILABILITY_LABELS, LEVELS, POSITIONS } from "@/lib/domain/reference";
import { PlayerCard } from "@/components/player-card";
import { CountrySelect } from "@/components/country-select";
import { Badge, Empty, Field, Flash } from "@/components/ui";
import { saveSearchAction } from "@/app/actions/recruiter";

export const metadata = { title: "Recherche de joueurs" };
const PAGE_SIZE = 20;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const where = buildPlayerWhere(filters, new Date(), { includeMinors: user.role === "ADMIN" || user.recruiter?.verification === "VERIFIED" });
  const [total, players] = await Promise.all([
    db.playerProfile.count({ where }),
    db.playerProfile.findMany({
      where,
      include: { user: { select: { subscription: true } }, _count: { select: { videos: true } }, stats: { where: { verified: true }, select: { id: true }, take: 1 } },
      orderBy: [{ featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const qs = filtersToQueryString(filters);
  const sub = user.subscription;
  const trialEnds = sub?.status === "TRIALING" ? Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">Trouver un joueur</h1>
          <p className="muted">{total} profil{total > 1 ? "s" : ""} correspond{total > 1 ? "ent" : ""} à ta recherche.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.recruiter && (user.recruiter.verification === "VERIFIED" ? <Badge tone="blue">✓ Recruteur vérifié</Badge> : <Badge tone="gold">Vérification en cours</Badge>)}
          {trialEnds !== null && trialEnds > 0 && <Badge tone="green">Essai : {trialEnds} j restants</Badge>}
          {user.role === "RECRUITER" && !isSubscriptionActive(sub) && <Link href="/abonnement" className="btn-primary btn-sm">S&apos;abonner pour contacter</Link>}
        </div>
      </div>
      <Flash sp={sp} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <form className="card h-fit space-y-3" method="get">
          <Field label="Nom, ville ou club"><input className="input" name="q" defaultValue={filters.q} /></Field>
          <Field label="Poste">
            <select className="input" name="position" defaultValue={filters.position ?? ""}>
              <option value="">Tous</option>
              {POSITIONS.map((p) => <option key={p.code} value={p.code}>{p.label}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Âge min"><input className="input" type="number" name="minAge" min={13} max={45} defaultValue={filters.minAge} /></Field>
            <Field label="Âge max"><input className="input" type="number" name="maxAge" min={13} max={45} defaultValue={filters.maxAge} /></Field>
          </div>
          <Field label="Pied fort">
            <select className="input" name="foot" defaultValue={filters.foot ?? ""}>
              <option value="">Peu importe</option><option value="RIGHT">Droit</option><option value="LEFT">Gauche</option><option value="BOTH">Ambidextre</option>
            </select>
          </Field>
          <Field label="Taille min (cm)"><input className="input" type="number" name="minHeight" defaultValue={filters.minHeight} /></Field>
          <Field label="Pays de résidence"><CountrySelect name="country" defaultValue={filters.country ?? ""} includeAny /></Field>
          <Field label="Nationalité"><CountrySelect name="nationality" defaultValue={filters.nationality ?? ""} includeAny /></Field>
          <Field label="Niveau">
            <select className="input" name="level" defaultValue={filters.level ?? ""}>
              <option value="">Tous</option>
              {LEVELS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Contrat">
            <select className="input" name="contract" defaultValue={filters.contract ?? ""}>
              <option value="">Peu importe</option><option value="FREE">Libre</option><option value="UNDER_CONTRACT">Sous contrat</option>
            </select>
          </Field>
          <Field label="Disponibilité">
            <select className="input" name="availability" defaultValue={filters.availability ?? ""}>
              <option value="">Peu importe</option>
              {Object.entries(AVAILABILITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="withVideo" value="1" defaultChecked={filters.withVideo} /> Avec vidéo</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verifiedStats" value="1" defaultChecked={filters.verifiedStats} /> Stats vérifiées</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="relocate" value="1" defaultChecked={filters.relocate} /> Prêt à déménager</label>
          <button className="btn-primary w-full">Rechercher</button>
          <Link href="/recruteur/recherche" className="btn-secondary w-full">Réinitialiser</Link>
        </form>

        <div className="space-y-3">
          {user.role === "RECRUITER" && qs && (
            <form action={saveSearchAction} className="card flex flex-wrap items-end gap-2">
              <input type="hidden" name="query" value={qs} />
              <div className="flex-1"><Field label="Sauvegarder cette recherche + alertes courriel"><input className="input" name="name" placeholder="Ex. Ailiers gauches U21 libres" /></Field></div>
              <button className="btn-secondary">Sauvegarder</button>
            </form>
          )}
          {players.length === 0 ? (
            <Empty>Aucun joueur ne correspond. Essaie d&apos;élargir tes critères.</Empty>
          ) : (
            players.map((p) => (
              <PlayerCard
                key={p.id}
                p={{ ...p, featured: isPremiumPlayer(p.user.subscription), videoCount: p._count.videos, verifiedStats: p.stats.length > 0 }}
                action={<label className="flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" form="compare" name="ids" value={p.slug} /> Comparer</label>}
              />
            ))
          )}
          {players.length > 0 && (
            <form id="compare" action="/recruteur/comparer" method="get" className="flex justify-end">
              <button className="btn-secondary btn-sm">Comparer la sélection (2 à 4)</button>
            </form>
          )}
          <div className="flex justify-between">
            {page > 1 ? <Link className="btn-secondary btn-sm" href={`?${qs}&page=${page - 1}`}>← Précédent</Link> : <span />}
            {page * PAGE_SIZE < total && <Link className="btn-secondary btn-sm" href={`?${qs}&page=${page + 1}`}>Suivant →</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
