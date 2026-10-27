import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { countryName, formatDate } from "@/i18n/format";
import { positionLabel } from "@/lib/domain/reference";
import { RADIUS_OPTIONS, nearby, parseLatLng, parseRadius, type LatLng } from "@/lib/domain/distance";
import { geocode } from "@/lib/geocode";
import { Badge, Empty, Flash } from "@/components/ui";
import { CountrySelect } from "@/components/country-select";
import { TrialsMap, type MapTrial } from "@/components/trials-map";
import { NearMeButton } from "@/components/near-me-button";
import { SponsoredBanner, SponsoredInterstitial } from "@/components/sponsored";

export async function generateMetadata() {
  const m = await getMessages();
  return { title: m.trials.metaTitle, description: m.trials.intro };
}

export default async function TrialsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m, locale, user] = await Promise.all([searchParams, getMessages(), getLocale(), getCurrentUser()]);
  const t = m.trials;
  const country = /^[A-Z]{2}$/.test(sp.country ?? "") ? sp.country : undefined;
  const ville = (sp.ville ?? "").trim().slice(0, 80);
  const radius = parseRadius(sp.rayon);

  // Centre de recherche : position du téléphone, ou ville saisie (convertie en coordonnées).
  let center: LatLng | null = parseLatLng(sp.lat, sp.lng);
  let placeUnknown = false;
  if (!center && ville) {
    center = await geocode({ city: ville, country });
    placeUnknown = !center;
  }

  const upcoming = await db.trialEvent.findMany({
    where: { startsAt: { gt: new Date() }, recruiter: { suspended: false }, ...(country && !center ? { country } : {}) },
    include: { recruiter: { include: { recruiter: true } }, _count: { select: { applications: true } } },
    orderBy: { startsAt: "asc" },
    take: 300,
  });
  // Avec un centre : seulement les détections dans le rayon, de la plus proche à la plus lointaine.
  const rows = center ? nearby(upcoming, center, radius).map((x) => ({ tr: x.item, km: Math.round(x.km) })) : upcoming.slice(0, 100).map((tr) => ({ tr, km: null as number | null }));

  const mapTrials: MapTrial[] = rows.flatMap(({ tr }) =>
    tr.latitude == null || tr.longitude == null
      ? []
      : [{
          id: tr.id, title: tr.title, lat: tr.latitude, lng: tr.longitude,
          when: formatDate(tr.startsAt, locale, { dateStyle: "medium", timeStyle: "short" }),
          place: `${tr.city}, ${countryName(tr.country, locale)}`, org: tr.recruiter.recruiter?.organization ?? "",
        }],
  );
  const canPost = user?.role === "RECRUITER";
  const heading = center ? (ville && !sp.lat ? t.around(ville, radius) : t.aroundYou(radius)) : null;

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

      <div className="card space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <NearMeButton text={{ nearMe: t.nearMe, locating: t.locating, denied: t.denied }} />
          <form className="flex flex-1 flex-wrap items-end gap-2" method="get" data-testid="trials-search">
            <label className="min-w-40 flex-1">
              <span className="mb-1 block text-xs font-semibold text-gray-600">{t.cityLabel}</span>
              <input className="input" name="ville" defaultValue={ville} placeholder={t.cityPlaceholder} />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold text-gray-600">{t.radius}</span>
              <select className="input" name="rayon" defaultValue={String(radius)}>
                {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{t.km(r)}</option>)}
              </select>
            </label>
            <label className="w-56">
              <span className="mb-1 block text-xs font-semibold text-gray-600">{t.country}</span>
              <CountrySelect name="country" locale={locale} defaultValue={country ?? ""} anyLabel={m.search.allCountries} />
            </label>
            <button className="btn-secondary">{t.filter}</button>
          </form>
        </div>
        {placeUnknown && <p role="status" className="text-sm text-red-700">{t.placeUnknown}</p>}
        {heading && (
          <p className="flex flex-wrap items-center gap-3 text-sm font-semibold text-pitch-800">
            📍 {heading} · {rows.length}
            <Link href="/detections" className="font-normal underline">{t.clearPlace}</Link>
          </p>
        )}
        <TrialsMap trials={mapTrials} center={center} radiusKm={center ? radius : undefined} text={{ ...t.map }} />
      </div>

      <SponsoredBanner />
      <SponsoredInterstitial />
      {rows.length === 0 ? <Empty>{t.empty}</Empty> : (
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map(({ tr, km }) => (
            <Link key={tr.id} href={`/detections/${tr.id}`} className="card block transition hover:border-pitch-500 hover:shadow-md">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="green">{t.freeBadge}</Badge>
                {tr.recruiter.recruiter?.verification === "VERIFIED" && <Badge tone="blue">{m.labels.verifiedShort}</Badge>}
                <Badge>{t.ages(tr.minAge, tr.maxAge)}</Badge>
                {km !== null && <Badge tone="gold">📍 {t.away(km)}</Badge>}
              </div>
              <h2 className="h2 mt-2">{tr.title}</h2>
              <p className="text-sm text-gray-700">📅 {formatDate(tr.startsAt, locale, { dateStyle: "full", timeStyle: "short" })}</p>
              <p className="text-sm text-gray-700">📍 {tr.address ? `${tr.address}, ` : ""}{tr.city}, {countryName(tr.country, locale)}</p>
              <p className="muted mt-1">{tr.recruiter.recruiter?.organization} · {t.deadline(formatDate(tr.deadline, locale))}</p>
              {tr.positions.length > 0 && <p className="mt-1 text-xs text-gray-600">{tr.positions.map((p) => positionLabel(m, p)).join(" · ")}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
