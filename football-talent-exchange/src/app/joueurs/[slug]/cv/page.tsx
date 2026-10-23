import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { canView, loadPlayerBySlug } from "@/lib/players";
import { ageOn } from "@/lib/domain/age";
import { AVAILABILITY_LABELS, countryName, FOOT_LABELS, levelLabel, positionLabel } from "@/lib/domain/reference";
import { appUrl } from "@/lib/email";
import { PrintButton } from "@/components/print-button";

export const metadata = { title: "Fiche joueur", robots: { index: false } };

export default async function CvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, await getCurrentUser())) notFound();
  const rows: [string, string][] = [
    ["Âge", `${ageOn(p.birthDate)} ans (né le ${p.birthDate.toLocaleDateString("fr-CA", { timeZone: "UTC" })})`],
    ["Nationalité(s)", p.nationalities.map(countryName).join(", ") || "—"],
    ["Résidence", `${p.city ? p.city + ", " : ""}${countryName(p.country)}`],
    ["Poste", `${positionLabel(p.mainPosition)}${p.otherPositions.length ? ` (aussi ${p.otherPositions.map(positionLabel).join(", ")})` : ""}`],
    ["Physique", `${p.heightCm ?? "—"} cm · ${p.weightKg ?? "—"} kg · pied ${p.foot ? FOOT_LABELS[p.foot].toLowerCase() : "—"}`],
    ["Niveau", levelLabel(p.currentLevel)],
    ["Statut", `${p.contractStatus === "FREE" ? "Libre" : "Sous contrat"} · ${p.hasAgent ? "avec agent" : "sans agent"} · ${AVAILABILITY_LABELS[p.availability]}`],
    ["Langues", p.languages.join(", ") || "—"],
  ];
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex justify-end"><PrintButton /></div>
      <header className="flex items-end justify-between border-b-4 border-pitch-600 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-pitch-700">Football Talent Exchange · CV football</p>
          <h1 className="text-3xl font-extrabold">{p.firstName} {p.lastName}</h1>
        </div>
        <p className="text-right text-xs text-gray-500">{appUrl()}/joueurs/{p.slug}</p>
      </header>
      <table className="mt-6 w-full text-sm">
        <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-gray-100"><th className="w-40 py-2 text-left font-semibold text-gray-600">{k}</th><td>{v}</td></tr>)}</tbody>
      </table>
      {p.bio && <section className="mt-6"><h2 className="mb-1 font-bold">Présentation</h2><p className="whitespace-pre-line text-sm">{p.bio}</p></section>}
      <section className="mt-6">
        <h2 className="mb-2 font-bold">Parcours</h2>
        <ul className="space-y-1 text-sm">{p.career.map((e) => <li key={e.id}><b>{e.startYear}–{e.endYear ?? "auj."}</b> · {e.club} · {levelLabel(e.level)}</li>)}</ul>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 font-bold">Statistiques</h2>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-1">Saison</th><th>Club</th><th>MJ</th><th>Min</th><th>Buts</th><th>PD</th><th>CS</th><th /></tr></thead>
          <tbody>{p.stats.map((s) => <tr key={s.id} className="border-b border-gray-100"><td className="py-1">{s.season}</td><td>{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td><td>{s.goals}</td><td>{s.assists}</td><td>{s.cleanSheets}</td><td className="text-xs">{s.verified ? "✓ vérifiée" : "déclarée"}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 font-bold">Vidéos</h2>
        <ul className="space-y-1 text-sm">{p.videos.map((v) => <li key={v.id}>{v.title} — <span className="break-all text-pitch-700">{v.url}</span></li>)}</ul>
      </section>
      <p className="mt-8 text-xs text-gray-400">Pour contacter ce joueur, utilisez la messagerie sécurisée de Football Talent Exchange.</p>
    </div>
  );
}
