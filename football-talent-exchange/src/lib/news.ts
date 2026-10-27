import "server-only";
import { db } from "./db";
import { classify, parseFeed, type FeedItem } from "./domain/feeds";
import { detectScam } from "./domain/scam";

export interface FeedSource {
  name: string;
  url: string;
  language: string;
}

const gnews = (q: string, hl: string, gl: string, ceid: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

/** Sources par défaut (titres et liens publics). Remplaçables par la variable NEWS_FEEDS (JSON). */
export const DEFAULT_FEEDS: FeedSource[] = [
  { name: "Google Actualités", url: gnews("détection football jeunes", "fr", "FR", "FR:fr"), language: "fr" },
  { name: "Google Actualités", url: gnews("football détection OR \"journée de détection\" Afrique", "fr", "SN", "SN:fr"), language: "fr" },
  { name: "Google Actualités", url: gnews("football Afrique", "fr", "CI", "CI:fr"), language: "fr" },
  { name: "Google News", url: gnews("football \"open trials\" OR tryouts academy", "en", "GB", "GB:en"), language: "en" },
  { name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/football/rss.xml", language: "en" },
  { name: "Google Noticias", url: gnews("pruebas de fútbol jugadores juveniles", "es", "ES", "ES:es"), language: "es" },
  { name: "Google Notícias", url: gnews("peneira futebol", "pt-BR", "BR", "BR:pt-419"), language: "pt" },
  { name: "أخبار Google", url: gnews("اختبارات كرة القدم", "ar", "MA", "MA:ar"), language: "ar" },
];

export function feedSources(env = process.env.NEWS_FEEDS): FeedSource[] {
  if (!env) return DEFAULT_FEEDS;
  try {
    const list = JSON.parse(env) as FeedSource[];
    return list.filter((f) => f && /^https:\/\//.test(f.url) && f.name && f.language);
  } catch {
    return DEFAULT_FEEDS;
  }
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { "User-Agent": "FootballTalentExchange/1.0 (+news)" } });
    if (!res.ok) return null;
    return (await res.text()).slice(0, 2_000_000);
  } catch {
    return null;
  }
}

/** Articles via NewsAPI.org (facultatif, avec NEWS_API_KEY). */
async function fromNewsApi(): Promise<{ source: FeedSource; items: FeedItem[] }[]> {
  const key = process.env.NEWS_API_KEY;
  if (!key) return [];
  const queries: [string, string][] = [["football AND (détection OR essais)", "fr"], ["football AND (trials OR tryouts)", "en"]];
  const out: { source: FeedSource; items: FeedItem[] }[] = [];
  for (const [q, language] of queries) {
    const text = await fetchText(`https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=${language}&sortBy=publishedAt&pageSize=30&apiKey=${key}`);
    if (!text) continue;
    try {
      const json = JSON.parse(text) as { articles?: { title: string; url: string; description: string | null; urlToImage: string | null; publishedAt: string; source?: { name?: string } }[] };
      out.push({
        source: { name: "NewsAPI", url: "https://newsapi.org", language },
        items: (json.articles ?? []).map((a) => ({ title: a.title, url: a.url, summary: (a.description ?? "").slice(0, 400), imageUrl: a.urlToImage, publishedAt: new Date(a.publishedAt) })),
      });
    } catch {}
  }
  return out;
}

/**
 * Récupère toutes les sources, classe chaque article (opportunité ou actualité) et l'enregistre une seule fois.
 * Les annonces qui demandent de l'argent (fausses détections) sont écartées. Les articles de plus de 60 jours sont supprimés.
 */
export async function refreshNews(now = new Date()) {
  const batches: { source: FeedSource; items: FeedItem[] }[] = [];
  for (const source of feedSources()) {
    const xml = await fetchText(source.url);
    if (xml) batches.push({ source, items: parseFeed(xml) });
  }
  batches.push(...(await fromNewsApi()));
  let added = 0, skipped = 0;
  for (const { source, items } of batches) {
    for (const it of items.slice(0, 60)) {
      if (!/^https?:\/\//.test(it.url)) continue;
      if (detectScam(`${it.title} ${it.summary}`).length > 0) { skipped++; continue; }
      const publishedAt = it.publishedAt && it.publishedAt <= now ? it.publishedAt : now;
      const res = await db.newsItem.upsert({
        where: { url: it.url },
        create: { url: it.url, title: it.title, summary: it.summary, imageUrl: it.imageUrl, source: source.name, language: source.language, kind: classify(it), publishedAt },
        update: {},
      });
      if (res.createdAt >= now) added++;
    }
  }
  const removed = await db.newsItem.deleteMany({ where: { publishedAt: { lt: new Date(now.getTime() - 60 * 86400000) } } });
  return { sources: batches.length, added, skipped, removed: removed.count };
}
