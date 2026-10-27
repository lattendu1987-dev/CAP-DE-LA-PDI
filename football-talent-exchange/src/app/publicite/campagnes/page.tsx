import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate, formatUsd } from "@/i18n/format";
import { AD_AUDIENCES, AD_DURATIONS, AD_FORMATS, type AdFormat } from "@/lib/domain/ads";
import { MOBILE_MONEY } from "@/lib/domain/mobile-money";
import { publicUrl } from "@/lib/storage";
import { Badge, Empty, Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { UploadField } from "@/components/upload-field";
import { CountryMultiSelect } from "@/components/country-multi-select";
import { FormAutosave } from "@/components/form-autosave";
import { autosaveText, uploadText } from "@/lib/ui-text";
import { createAdAction, stopAdAction } from "@/app/actions/ads";

export async function generateMetadata() {
  return { title: (await getMessages()).ads.myCampaigns };
}

const TONE = { ACTIVE: "green", PENDING_PAYMENT: "gold", ENDED: undefined, REJECTED: "red", STOPPED: "red" } as const;

export default async function CampaignsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["ADVERTISER", "ADMIN"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.ads;
  const f = t.fields;
  const campaigns = await db.adCampaign.findMany({
    where: user.role === "ADMIN" ? {} : { advertiserId: user.id },
    include: { advertiser: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const hasMobile = !!MOBILE_MONEY[user.country];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="h1">{t.myCampaigns}</h1>
        <Link href="/publicite" className="link text-sm">{t.metaTitle}</Link>
      </div>
      <Flash sp={sp} />

      <section className="space-y-3" data-testid="campaigns">
        {campaigns.length === 0 ? <Empty>{t.empty}</Empty> : campaigns.map((c) => {
          const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";
          return (
            <div key={c.id} className="card flex flex-wrap items-center gap-4">
              {c.mediaType === "video"
                ? <video src={publicUrl(c.mediaKey)} muted playsInline preload="metadata" className="h-20 w-32 rounded-lg bg-black object-cover" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={publicUrl(c.mediaKey)} alt="" className="h-20 w-32 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={TONE[c.status]}>{t.status[c.status]}</Badge>
                  <span className="text-xs text-gray-500">{t.formats[c.format][0]} · {t.audiences[c.audience]} · {c.countries.length ? c.countries.join(", ") : t.worldwide}</span>
                </div>
                <p className="mt-1 font-bold" dir="auto">{c.headline}</p>
                <p className="text-xs text-gray-500">
                  {user.role === "ADMIN" && `${c.advertiser.name} · `}
                  {formatUsd(c.priceCents, locale)} · {t.days(c.days)}{c.endsAt && ` · ${t.until(formatDate(c.endsAt, locale))}`}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-4 text-center text-sm tabular-nums">
                <div><dt className="text-xs text-gray-500">{t.impressions}</dt><dd className="font-bold" data-testid="ad-impressions">{c.impressions}</dd></div>
                <div><dt className="text-xs text-gray-500">{t.clicks}</dt><dd className="font-bold">{c.clicks}</dd></div>
                <div><dt className="text-xs text-gray-500">{t.ctr}</dt><dd className="font-bold">{ctr} %</dd></div>
              </dl>
              {c.status === "ACTIVE" && (
                <form action={stopAdAction}><input type="hidden" name="id" value={c.id} /><button className="btn-secondary btn-sm">{t.stop}</button></form>
              )}
            </div>
          );
        })}
      </section>

      {user.role === "ADVERTISER" && (
        <section className="card space-y-5">
          <h2 className="h2">{t.newCampaign}</h2>
          <form action={createAdAction} className="grid gap-5 lg:grid-cols-2" data-testid="new-campaign">
            <div className="lg:col-span-2"><FormAutosave id="new-ad" text={autosaveText(m)} /></div>
            <div className="space-y-4">
              <div><p className="label">{f.media}</p><UploadField kind="ad" text={{ ...uploadText(m, "photo"), choose: f.media, hint: f.mediaHint }} /></div>
              <Field label={f.headline}><input className="input" name="headline" required minLength={5} maxLength={90} dir="auto" /></Field>
              <Field label={f.link}><input className="input" type="url" name="linkUrl" required placeholder="https://" dir="ltr" /></Field>
            </div>
            <div className="space-y-4">
              <fieldset>
                <legend className="label">{f.format}</legend>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(AD_FORMATS) as AdFormat[]).map((k, i) => (
                    <label key={k} className="flex items-start gap-2 rounded-xl border border-gray-200 p-3 text-sm">
                      <input type="radio" name="format" value={k} defaultChecked={i === 0} className="mt-1" />
                      <span><b>{t.formats[k][0]}</b> — {t.perDay(formatUsd(AD_FORMATS[k].perDayUsd * 100, locale))}<br /><span className="text-gray-600">{t.formats[k][1]}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={f.audience}>
                  <select className="input" name="audience">{AD_AUDIENCES.map((a) => <option key={a} value={a}>{t.audiences[a]}</option>)}</select>
                </Field>
                <Field label={f.duration}>
                  <select className="input" name="days" defaultValue="14">{AD_DURATIONS.map((d) => <option key={d} value={d}>{t.days(d)}</option>)}</select>
                </Field>
              </div>
              <fieldset>
                <legend className="label">{f.countries}</legend>
                <CountryMultiSelect name="countries" locale={locale} />
                <p className="mt-1 text-xs text-gray-500">{f.countriesHint}</p>
              </fieldset>
              <fieldset>
                <legend className="label">{f.method}</legend>
                <div className="flex flex-wrap gap-4 text-sm">
                  <label className="flex items-center gap-2"><input type="radio" name="method" value="card" defaultChecked /> 💳 {t.card}</label>
                  {hasMobile && <label className="flex items-center gap-2"><input type="radio" name="method" value="mobile" /> 📱 {t.mobile}</label>}
                </div>
              </fieldset>
              <p className="text-sm text-gray-600">{t.priceNote}</p>
              <SubmitButton className="btn-primary w-full" pendingLabel={m.common.wait}>{t.submit}</SubmitButton>
            </div>
          </form>
          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="font-semibold">{t.rulesTitle}</p>
            <ul className="mt-1 space-y-1">{t.rules.map((r) => <li key={r}>• {r}</li>)}</ul>
          </div>
        </section>
      )}
    </div>
  );
}
