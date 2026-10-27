import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate } from "@/i18n/format";
import { Empty, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { hideNewsAction, refreshNewsAction } from "@/app/actions/news";
import { SponsoredBanner, SponsoredInterstitial } from "@/components/sponsored";

export async function generateMetadata() {
  const m = await getMessages();
  return { title: m.news.metaTitle, description: m.news.intro };
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const [sp, m, locale, user] = await Promise.all([searchParams, getMessages(), getLocale(), getCurrentUser()]);
  const t = m.news;
  const kind = sp.onglet === "NEWS" ? "NEWS" : "OPPORTUNITY";
  const allLang = sp.langues === "toutes";
  const admin = user?.role === "ADMIN";
  const base = { kind, hidden: false } as const;
  let items = await db.newsItem.findMany({ where: { ...base, ...(allLang ? {} : { language: locale }) }, orderBy: { publishedAt: "desc" }, take: 60 });
  // Rien dans ma langue : on montre les autres langues plutôt qu'une page vide.
  const fellBack = !allLang && items.length === 0;
  if (fellBack) items = await db.newsItem.findMany({ where: base, orderBy: { publishedAt: "desc" }, take: 60 });
  const qs = (o: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const v = { onglet: kind, langues: allLang ? "toutes" : undefined, ...o };
    for (const [k, x] of Object.entries(v)) if (x) q.set(k, x);
    return `?${q.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="h1">{t.title}</h1>
          <p className="muted mt-1">{t.intro}</p>
        </div>
        {admin && <form action={refreshNewsAction}><SubmitButton className="btn-secondary" pendingLabel={m.common.wait}>🔄 {t.refresh}</SubmitButton></form>}
      </div>
      <Flash sp={sp} />
      <nav className="flex flex-wrap items-center gap-2" aria-label={t.title}>
        {(["OPPORTUNITY", "NEWS"] as const).map((k) => (
          <Link key={k} href={qs({ onglet: k })} aria-current={k === kind ? "page" : undefined} className={k === kind ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{t.tabs[k]}</Link>
        ))}
        <Link href={qs({ langues: allLang ? undefined : "toutes" })} className="ms-auto text-sm underline">{allLang ? t.myLanguage : t.allLanguages}</Link>
      </nav>
      {kind === "OPPORTUNITY" && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">⚠️ {t.warning}</p>}
      <SponsoredBanner />
      <SponsoredInterstitial />
      {items.length === 0 ? <Empty>{t.empty}</Empty> : (
        <ul className="grid gap-4 md:grid-cols-2" data-testid="news-list">
          {items.map((it) => (
            <li key={it.id} className="card flex gap-4">
              {it.imageUrl && (
                // Image hébergée par la source : chargée seulement à l'affichage.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.imageUrl} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-20 w-28 shrink-0 rounded-lg object-cover" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{it.source} · {formatDate(it.publishedAt, locale)}</p>
                <h2 className="mt-1 font-bold leading-snug" dir="auto">{it.title}</h2>
                {it.summary && <p className="mt-1 line-clamp-3 text-sm text-gray-700" dir="auto">{it.summary}</p>}
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <a href={it.url} target="_blank" rel="noopener noreferrer nofollow" className="link text-sm">{t.read} ↗</a>
                  {admin && (
                    <form action={hideNewsAction}>
                      <input type="hidden" name="id" value={it.id} />
                      <input type="hidden" name="onglet" value={kind} />
                      <button className="text-xs text-red-700 hover:underline">{t.hide}</button>
                    </form>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
