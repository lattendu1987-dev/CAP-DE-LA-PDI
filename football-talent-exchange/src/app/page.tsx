import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, homeFor } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { TRIAL_DAYS } from "@/lib/domain/pricing";
import { Flash } from "@/components/ui";

export default async function Home({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await getCurrentUser();
  if (user) redirect(homeFor(user.role));
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.home;
  const ref = /^[A-Za-z0-9]{6,12}$/.test(sp.ref ?? "") ? `&ref=${sp.ref.toUpperCase()}` : "";
  const [players, recruiters, countries, trials] = await Promise.all([
    db.playerProfile.count({ where: { published: true } }),
    db.recruiterProfile.count(),
    db.playerProfile.groupBy({ by: ["country"], where: { published: true } }).then((r) => r.length),
    db.trialEvent.findMany({ where: { startsAt: { gt: new Date() }, recruiter: { suspended: false } }, orderBy: { startsAt: "asc" }, take: 3 }),
  ]);

  return (
    <div className="space-y-16">
      <Flash sp={sp} />
      <section className="relative overflow-hidden rounded-3xl bg-pitch-900 px-6 py-14 text-white sm:px-12 sm:py-20">
        <div aria-hidden className="absolute inset-0 opacity-15" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 60px, rgba(255,255,255,.35) 60px 120px)" }} />
        <div aria-hidden className="absolute -end-24 -top-24 h-72 w-72 rounded-full border-[10px] border-white/10" />
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest">{t.kicker}</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{t.title1} <span className="text-gold">{t.title2}</span></h1>
          <p className="mt-5 text-lg text-white/80">{t.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/inscription?role=joueur${ref}`} className="btn bg-white text-pitch-900 hover:bg-pitch-50">{t.ctaPlayer}</Link>
            <Link href={`/inscription?role=recruteur${ref}`} className="btn border border-white/40 text-white hover:bg-white/10">{t.ctaRecruiter(TRIAL_DAYS)}</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 text-center">
        {([[players, t.statPlayers], [recruiters, t.statRecruiters], [countries, t.statCountries]] as const).map(([n, l]) => (
          <div key={l} className="card"><p className="text-3xl font-extrabold text-pitch-700">{n}</p><p className="muted">{l}</p></div>
        ))}
      </section>

      <section>
        <h2 className="h1 mb-6 text-center">{t.howTitle}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {t.steps.map(([i, title, d]) => (
            <div key={title} className="card"><p className="text-3xl">{i}</p><h3 className="h2 mt-2">{title}</h3><p className="muted mt-1">{d}</p></div>
          ))}
        </div>
      </section>

      {trials.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="h1">{t.trialsTitle}</h2>
            <Link href="/detections" className="link text-sm">{t.trialsAll}</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trials.map((tr) => (
              <Link key={tr.id} href={`/detections/${tr.id}`} className="card block hover:border-pitch-500">
                <p className="font-bold">{tr.title}</p>
                <p className="muted">📅 {formatDate(tr.startsAt, locale)} · 📍 {tr.city}, {countryName(tr.country, locale)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <h2 className="h2">{t.safetyTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">{t.safety.map((s) => <li key={s}>• {s}</li>)}</ul>
          <Link href="/securite" className="link mt-3 inline-block text-sm">{t.learnMore}</Link>
        </div>
        <div className="card">
          <h2 className="h2">{t.worldTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">{t.world.map((s) => <li key={s}>• {s}</li>)}</ul>
          <Link href="/tarifs" className="link mt-3 inline-block text-sm">{t.seePricing}</Link>
        </div>
      </section>
    </div>
  );
}
