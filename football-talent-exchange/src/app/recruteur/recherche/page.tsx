import { SponsoredBanner } from "@/components/sponsored";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { buildPlayerWhere, filtersToQueryString, parseFilters } from "@/lib/domain/search";
import { isPremiumPlayer, isSubscriptionActive } from "@/lib/domain/rules";
import { AVAILABILITY_CODES, LEVEL_CODES, POSITION_CODES } from "@/lib/domain/reference";
import { PlayerCard } from "@/components/player-card";
import { CountrySelect } from "@/components/country-select";
import { Badge, Empty, Field, Flash } from "@/components/ui";
import { saveSearchAction } from "@/app/actions/recruiter";
import { PushBanner } from "@/components/push-banner";
import { AutoOpenDetails } from "@/components/auto-open-details";

export async function generateMetadata() {
  return { title: (await getMessages()).search.metaTitle };
}
const PAGE_SIZE = 20;

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["RECRUITER", "ADMIN"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.search;
  const filters = parseFilters(sp);
  const page = Math.max(1, Number(sp.page) || 1);
  const verified = user.role === "ADMIN" || user.recruiter?.verification === "VERIFIED";
  const where = buildPlayerWhere(filters, new Date(), { includeMinors: verified });
  // Les Boosts terminés repassent dans l'ordre normal.
  await db.playerProfile.updateMany({ where: { boostedUntil: { lt: new Date() } }, data: { boostedUntil: null } });
  const [total, players] = await Promise.all([
    db.playerProfile.count({ where }),
    db.playerProfile.findMany({
      where,
      include: { user: { select: { subscription: true } }, _count: { select: { videos: true } }, stats: { where: { verified: true }, select: { id: true }, take: 1 } },
      // Boost payé d'abord, puis joueurs Premium, puis profils récemment mis à jour.
      orderBy: [{ boostedUntil: { sort: "desc", nulls: "last" } }, { featuredUntil: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  const qs = filtersToQueryString(filters);
  const activeFilters = Object.values(filters).filter((v) => v !== undefined && v !== false).length;
  const sub = user.subscription;
  const trialEnds = sub?.status === "TRIALING" ? Math.ceil((sub.currentPeriodEnd.getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="h1">{t.title}</h1>
          <p className="muted">{t.results(total)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {user.recruiter && (user.recruiter.verification === "VERIFIED" ? <Badge tone="blue">{m.labels.recruiterVerified}</Badge> : <Badge tone="gold">{m.labels.pendingVerification}</Badge>)}
          {trialEnds !== null && trialEnds > 0 && <Badge tone="green">{t.trialDays(trialEnds)}</Badge>}
          {user.role === "RECRUITER" && !isSubscriptionActive(sub) && <Link href="/abonnement" className="btn-primary btn-sm">{t.subscribeToContact}</Link>}
        </div>
      </div>
      <Flash sp={sp} />
      {user.role === "RECRUITER" && <PushBanner m={m} />}
      <SponsoredBanner />
      {!verified && <p className="text-xs text-gray-500">{t.minorsHidden}</p>}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <AutoOpenDetails className="filters h-fit" summary={<span className="flex items-center justify-between gap-2"><span>{t.filters}{activeFilters > 0 && <span className="ms-2 rounded-full bg-pitch-700 px-2 py-0.5 text-xs text-white">{activeFilters}</span>}</span><span aria-hidden className="filters-chevron">⌄</span></span>}>
        <form className="card space-y-3" method="get">
          <Field label={t.q}><input className="input" name="q" defaultValue={filters.q} /></Field>
          <Field label={t.position}>
            <select className="input" name="position" defaultValue={filters.position ?? ""}>
              <option value="">{m.common.all}</option>
              {POSITION_CODES.map((c) => <option key={c} value={c}>{m.labels.positions[c]}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t.minAge}><input className="input" type="number" name="minAge" min={13} max={45} defaultValue={filters.minAge} /></Field>
            <Field label={t.maxAge}><input className="input" type="number" name="maxAge" min={13} max={45} defaultValue={filters.maxAge} /></Field>
          </div>
          <Field label={t.foot}>
            <select className="input" name="foot" defaultValue={filters.foot ?? ""}>
              <option value="">{m.common.any}</option>
              {(["RIGHT", "LEFT", "BOTH"] as const).map((f) => <option key={f} value={f}>{m.labels.foot[f]}</option>)}
            </select>
          </Field>
          <Field label={t.minHeight}><input className="input" type="number" name="minHeight" defaultValue={filters.minHeight} /></Field>
          <Field label={t.country}><CountrySelect name="country" locale={locale} defaultValue={filters.country ?? ""} anyLabel={t.allCountries} /></Field>
          <Field label={t.nationality}><CountrySelect name="nationality" locale={locale} defaultValue={filters.nationality ?? ""} anyLabel={t.allCountries} /></Field>
          <Field label={t.level}>
            <select className="input" name="level" defaultValue={filters.level ?? ""}>
              <option value="">{m.common.all}</option>
              {LEVEL_CODES.map((l) => <option key={l} value={l}>{m.labels.levels[l]}</option>)}
            </select>
          </Field>
          <Field label={t.contract}>
            <select className="input" name="contract" defaultValue={filters.contract ?? ""}>
              <option value="">{m.common.any}</option><option value="FREE">{m.labels.free}</option><option value="UNDER_CONTRACT">{m.labels.underContract}</option>
            </select>
          </Field>
          <Field label={t.availability}>
            <select className="input" name="availability" defaultValue={filters.availability ?? ""}>
              <option value="">{m.common.any}</option>
              {AVAILABILITY_CODES.map((k) => <option key={k} value={k}>{m.labels.availability[k]}</option>)}
            </select>
          </Field>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="withVideo" value="1" defaultChecked={filters.withVideo} /> {t.withVideo}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="verifiedStats" value="1" defaultChecked={filters.verifiedStats} /> {t.verifiedStats}</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="relocate" value="1" defaultChecked={filters.relocate} /> {t.relocate}</label>
          <button className="btn-primary w-full">{m.common.search}</button>
          <Link href="/recruteur/recherche" className="btn-secondary w-full">{m.common.reset}</Link>
        </form>
        </AutoOpenDetails>

        <div className="space-y-3">
          {user.role === "RECRUITER" && qs && (
            <form action={saveSearchAction} className="card flex flex-wrap items-end gap-2">
              <input type="hidden" name="query" value={qs} />
              <div className="flex-1"><Field label={t.saveTitle}><input className="input" name="name" placeholder={t.savePlaceholder} /></Field></div>
              <button className="btn-secondary">{t.saveButton}</button>
            </form>
          )}
          {players.length === 0 ? (
            <Empty>{t.empty}</Empty>
          ) : (
            players.map((p) => (
              <PlayerCard
                key={p.id}
                m={m}
                locale={locale}
                p={{ ...p, featured: isPremiumPlayer(p.user.subscription), boosted: !!p.boostedUntil && p.boostedUntil > new Date(), videoCount: p._count.videos, verifiedStats: p.stats.length > 0 }}
                action={<label className="flex items-center gap-1 text-xs text-gray-600"><input type="checkbox" form="compare" name="ids" value={p.slug} /> {t.compare}</label>}
              />
            ))
          )}
          {players.length > 0 && (
            <form id="compare" action="/recruteur/comparer" method="get" className="flex justify-end">
              <button className="btn-secondary btn-sm">{t.compareSelected}</button>
            </form>
          )}
          <div className="flex justify-between">
            {page > 1 ? <Link className="btn-secondary btn-sm" href={`?${qs}&page=${page - 1}`}>{m.common.previous}</Link> : <span />}
            {page * PAGE_SIZE < total && <Link className="btn-secondary btn-sm" href={`?${qs}&page=${page + 1}`}>{m.common.next}</Link>}
          </div>
        </div>
      </div>
    </div>
  );
}
