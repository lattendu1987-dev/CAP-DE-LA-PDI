import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { positionLabel } from "@/lib/domain/reference";
import { Badge, Empty, Flash } from "@/components/ui";
import { CountrySelect } from "@/components/country-select";

export async function generateMetadata() {
  const m = await getMessages();
  return { title: m.trials.metaTitle, description: m.trials.intro };
}

export default async function TrialsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m, locale, user] = await Promise.all([searchParams, getMessages(), getLocale(), getCurrentUser()]);
  const t = m.trials;
  const country = /^[A-Z]{2}$/.test(sp.country ?? "") ? sp.country : undefined;
  const trials = await db.trialEvent.findMany({
    where: { startsAt: { gt: new Date() }, recruiter: { suspended: false }, ...(country ? { country } : {}) },
    include: { recruiter: { include: { recruiter: true } }, _count: { select: { applications: true } } },
    orderBy: { startsAt: "asc" },
    take: 100,
  });
  const canPost = user?.role === "RECRUITER";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="h1">{t.title}</h1>
          <p className="muted mt-1">{t.intro}</p>
        </div>
        {canPost && <Link href="/detections/nouvelle" className="btn-primary">{t.newTitle}</Link>}
      </div>
      <Flash sp={sp} />
      <form className="flex flex-wrap items-end gap-2" method="get">
        <div className="w-64"><CountrySelect name="country" locale={locale} defaultValue={country ?? ""} anyLabel={m.search.allCountries} /></div>
        <button className="btn-secondary">{t.filter}</button>
      </form>
      {trials.length === 0 ? <Empty>{t.empty}</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {trials.map((tr) => (
            <Link key={tr.id} href={`/detections/${tr.id}`} className="card block transition hover:border-pitch-500 hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">{t.freeBadge}</Badge>
                {tr.recruiter.recruiter?.verification === "VERIFIED" && <Badge tone="blue">{m.labels.verifiedShort}</Badge>}
                <Badge>{t.ages(tr.minAge, tr.maxAge)}</Badge>
              </div>
              <h2 className="h2 mt-2">{tr.title}</h2>
              <p className="text-sm text-gray-700">📅 {formatDate(tr.startsAt, locale, { dateStyle: "full", timeStyle: "short" })}</p>
              <p className="text-sm text-gray-700">📍 {tr.city}, {countryName(tr.country, locale)}</p>
              <p className="muted mt-1">{tr.recruiter.recruiter?.organization} · {t.deadline(formatDate(tr.deadline, locale))}</p>
              {tr.positions.length > 0 && <p className="mt-1 text-xs text-gray-600">{tr.positions.map((p) => positionLabel(m, p)).join(" · ")}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
