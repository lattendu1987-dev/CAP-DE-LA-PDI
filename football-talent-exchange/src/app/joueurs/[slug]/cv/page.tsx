import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { canView, loadPlayerBySlug } from "@/lib/players";
import { ageOn } from "@/lib/domain/age";
import { footLabel, levelLabel, positionLabel } from "@/lib/domain/reference";
import { appUrl } from "@/lib/email";
import { PrintButton } from "@/components/print-button";

export const metadata = { robots: { index: false } };

export default async function CvPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, m, locale, viewer] = await Promise.all([params, getMessages(), getLocale(), getCurrentUser()]);
  const t = m.cv;
  const p = await loadPlayerBySlug(slug);
  if (!p || !canView(p, viewer)) notFound();
  const rows: [string, string][] = [
    [t.age, t.bornOn(ageOn(p.birthDate), formatDate(p.birthDate, locale, { dateStyle: "long", timeZone: "UTC" }))],
    [t.nationalities, p.nationalities.map((c) => countryName(c, locale)).join(", ") || "—"],
    [t.residence, `${p.city ? p.city + ", " : ""}${countryName(p.country, locale)}`],
    [t.position, `${positionLabel(m, p.mainPosition)}${p.otherPositions.length ? ` (${m.profile.alsoPlays(p.otherPositions.map((c) => positionLabel(m, c)).join(", "))})` : ""}`],
    [t.physical, `${p.heightCm ?? "—"} cm · ${p.weightKg ?? "—"} kg · ${m.labels.footShort(footLabel(m, p.foot))}`],
    [t.level, levelLabel(m, p.currentLevel)],
    [t.status, `${p.contractStatus === "FREE" ? m.labels.free : m.labels.underContract} · ${p.hasAgent ? m.labels.withAgent : m.labels.withoutAgent} · ${m.labels.availability[p.availability]}`],
    [t.languages, p.languages.join(", ") || "—"],
  ];
  const h = m.player.statsHead;
  return (
    <div className="mx-auto max-w-3xl bg-white p-8 shadow-sm print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex justify-end"><PrintButton label={t.print} /></div>
      <header className="flex items-end justify-between gap-4 border-b-4 border-pitch-600 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-pitch-700">{t.kicker}</p>
          <h1 className="text-3xl font-extrabold">{p.firstName} {p.lastName}</h1>
        </div>
        <p className="text-end text-xs text-gray-500" dir="ltr">{appUrl()}/joueurs/{p.slug}</p>
      </header>
      <table className="mt-6 w-full text-sm">
        <tbody>{rows.map(([k, v]) => <tr key={k} className="border-b border-gray-100"><th className="w-40 py-2 text-start font-semibold text-gray-600">{k}</th><td>{v}</td></tr>)}</tbody>
      </table>
      {p.bio && <section className="mt-6"><h2 className="mb-1 font-bold">{m.profile.bio}</h2><p className="whitespace-pre-line text-sm">{p.bio}</p></section>}
      <section className="mt-6">
        <h2 className="mb-2 font-bold">{m.profile.career}</h2>
        <ul className="space-y-1 text-sm">{p.career.map((e) => <li key={e.id}><b>{e.startYear}–{e.endYear ?? m.common.today}</b> · {e.club} · {levelLabel(m, e.level)}</li>)}</ul>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 font-bold">{m.profile.stats}</h2>
        <table className="w-full text-sm">
          <thead><tr className="border-b text-xs uppercase text-gray-500"><th className="py-1 text-start">{m.player.season}</th><th className="text-start">{m.player.club}</th><th>{h.matches}</th><th>{h.minutes}</th><th>{h.goals}</th><th>{h.assists}</th><th>{h.cleanSheets}</th><th /></tr></thead>
          <tbody>{p.stats.map((s) => <tr key={s.id} className="border-b border-gray-100 text-center"><td className="py-1 text-start">{s.season}</td><td className="text-start">{s.club}</td><td>{s.matches}</td><td>{s.minutes}</td><td>{s.goals}</td><td>{s.assists}</td><td>{s.cleanSheets}</td><td className="text-xs">{s.verified ? t.verifiedLower : t.declaredLower}</td></tr>)}</tbody>
        </table>
      </section>
      <section className="mt-6">
        <h2 className="mb-2 font-bold">{m.profile.videos}</h2>
        <ul className="space-y-1 text-sm">{p.videos.map((v) => <li key={v.id}>{v.title} — <span className="break-all text-pitch-700" dir="ltr">{v.url.startsWith("/") ? `${appUrl()}/joueurs/${p.slug}` : v.url}</span></li>)}</ul>
      </section>
      <p className="mt-8 text-xs text-gray-400">{t.contactNote}</p>
    </div>
  );
}
