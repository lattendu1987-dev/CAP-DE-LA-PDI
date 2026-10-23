import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildPlayerWhere } from "@/lib/domain/search";
import { ageOn } from "@/lib/domain/age";
import { AVAILABILITY_LABELS, countryName, FOOT_LABELS, levelLabel, positionLabel } from "@/lib/domain/reference";
import { Avatar, Empty } from "@/components/ui";

export const metadata = { title: "Comparer des joueurs" };

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const sp = await searchParams;
  const slugs = (Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : []).slice(0, 4);
  const players = slugs.length
    ? await db.playerProfile.findMany({ where: { AND: [{ slug: { in: slugs } }, buildPlayerWhere({}, new Date(), { includeMinors: user.role === "ADMIN" || user.recruiter?.verification === "VERIFIED" })] }, include: { stats: true, _count: { select: { videos: true } } } })
    : [];
  const evals = user.recruiter
    ? await db.evaluation.findMany({ where: { recruiterId: user.recruiter.id, playerId: { in: players.map((p) => p.id) } } })
    : [];
  if (players.length < 2) return <Empty>Sélectionne 2 à 4 joueurs dans la <Link className="link" href="/recruteur/recherche">recherche</Link> pour les comparer.</Empty>;

  const rows: [string, (p: (typeof players)[number]) => React.ReactNode][] = [
    ["Poste", (p) => positionLabel(p.mainPosition)],
    ["Âge", (p) => `${ageOn(p.birthDate)} ans`],
    ["Taille / poids", (p) => `${p.heightCm ?? "—"} cm / ${p.weightKg ?? "—"} kg`],
    ["Pied fort", (p) => (p.foot ? FOOT_LABELS[p.foot] : "—")],
    ["Pays", (p) => countryName(p.country)],
    ["Niveau", (p) => levelLabel(p.currentLevel)],
    ["Contrat", (p) => (p.contractStatus === "FREE" ? "Libre" : "Sous contrat")],
    ["Disponibilité", (p) => AVAILABILITY_LABELS[p.availability]],
    ["Matchs (total)", (p) => p.stats.reduce((a, s) => a + s.matches, 0)],
    ["Buts", (p) => p.stats.reduce((a, s) => a + s.goals, 0)],
    ["Passes déc.", (p) => p.stats.reduce((a, s) => a + s.assists, 0)],
    ["Clean sheets", (p) => p.stats.reduce((a, s) => a + s.cleanSheets, 0)],
    ["Vidéos", (p) => p._count.videos],
    ["Mon évaluation", (p) => {
      const e = evals.find((x) => x.playerId === p.id);
      return e ? `${((e.technical + e.physical + e.tactical + e.mental) / 4).toFixed(1)}/10` : "—";
    }],
  ];
  return (
    <div>
      <h1 className="h1 mb-6">Comparateur</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-3" />
              {players.map((p) => (
                <th key={p.id} className="p-3 text-left">
                  <Link href={`/joueurs/${p.slug}`} className="flex items-center gap-2 hover:text-pitch-700">
                    <Avatar name={`${p.firstName} ${p.lastName}`} url={p.photoUrl} size={36} /> {p.firstName} {p.lastName}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, fn]) => (
              <tr key={label} className="border-b border-gray-50">
                <th className="p-3 text-left font-medium text-gray-500">{label}</th>
                {players.map((p) => <td key={p.id} className="p-3">{fn(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
