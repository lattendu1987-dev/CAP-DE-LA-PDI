import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName } from "@/i18n/format";
import { buildPlayerWhere } from "@/lib/domain/search";
import { ageOn } from "@/lib/domain/age";
import { footLabel, levelLabel, positionLabel } from "@/lib/domain/reference";
import { Avatar, Empty } from "@/components/ui";

export async function generateMetadata() {
  return { title: (await getMessages()).compare.metaTitle };
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.compare;
  const slugs = (Array.isArray(sp.ids) ? sp.ids : sp.ids ? [sp.ids] : []).slice(0, 4);
  const includeMinors = user.role === "ADMIN" || user.recruiter?.verification === "VERIFIED";
  const players = slugs.length
    ? await db.playerProfile.findMany({ where: { AND: [{ slug: { in: slugs } }, buildPlayerWhere({}, new Date(), { includeMinors })] }, include: { stats: true, _count: { select: { videos: true } } } })
    : [];
  const evals = user.recruiter ? await db.evaluation.findMany({ where: { recruiterId: user.recruiter.id, playerId: { in: players.map((p) => p.id) } } }) : [];
  if (players.length < 2) return <Empty><Link className="link" href="/recruteur/recherche">{t.needTwo}</Link></Empty>;

  const sum = (p: (typeof players)[number], k: "matches" | "goals" | "assists" | "cleanSheets") => p.stats.reduce((a, s) => a + s[k], 0);
  const rows: [string, (p: (typeof players)[number]) => React.ReactNode][] = [
    [t.rows.position, (p) => positionLabel(m, p.mainPosition)],
    [t.rows.age, (p) => m.common.years(ageOn(p.birthDate))],
    [t.rows.body, (p) => `${p.heightCm ?? "—"} cm / ${p.weightKg ?? "—"} kg`],
    [t.rows.foot, (p) => footLabel(m, p.foot)],
    [t.rows.country, (p) => countryName(p.country, locale)],
    [t.rows.level, (p) => levelLabel(m, p.currentLevel)],
    [t.rows.contract, (p) => (p.contractStatus === "FREE" ? m.labels.free : m.labels.underContract)],
    [t.rows.availability, (p) => m.labels.availability[p.availability]],
    [t.rows.matches, (p) => sum(p, "matches")],
    [t.rows.goals, (p) => sum(p, "goals")],
    [t.rows.assists, (p) => sum(p, "assists")],
    [t.rows.cleanSheets, (p) => sum(p, "cleanSheets")],
    [t.rows.videos, (p) => p._count.videos],
    [t.rows.myEval, (p) => {
      const e = evals.find((x) => x.playerId === p.id);
      return e ? `${((e.technical + e.physical + e.tactical + e.mental) / 4).toFixed(1)}/10` : "—";
    }],
  ];
  return (
    <div>
      <h1 className="h1 mb-6">{t.title}</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="p-3" />
              {players.map((p) => (
                <th key={p.id} className="p-3 text-start">
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
                <th className="p-3 text-start font-medium text-gray-500">{label}</th>
                {players.map((p) => <td key={p.id} className="p-3">{fn(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
