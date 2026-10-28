// Lecture des flux d'actualités (RSS 2.0 et Atom) sans bibliothèque, et tri entre
// « opportunités » (détections, essais, stages de recrutement) et actualités générales.

export interface FeedItem {
  title: string;
  url: string;
  summary: string;
  imageUrl: string | null;
  publishedAt: Date | null;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** Texte brut : sans CDATA, sans balises HTML, espaces normalisés. */
export function plainText(s: string): string {
  const noCdata = s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
  return decodeEntities(decodeEntities(noCdata).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function tag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : null;
}

function attr(block: string, name: string, attribute: string, where?: RegExp): string | null {
  const re = new RegExp(`<${name}\\s[^>]*>`, "gi");
  for (const m of block.match(re) ?? []) {
    if (where && !where.test(m)) continue;
    const a = m.match(new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, "i"));
    if (a) return decodeEntities(a[1]);
  }
  return null;
}

function safeUrl(u: string | null): string | null {
  if (!u) return null;
  const v = plainText(u);
  return /^https?:\/\/[^\s<>"]+$/i.test(v) ? v : null;
}

function date(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(plainText(s));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseFeed(xml: string): FeedItem[] {
  const isAtom = /<feed[\s>]/i.test(xml) && !/<rss[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s>][\s\S]*?<\/entry>/gi : /<item[\s>][\s\S]*?<\/item>/gi) ?? [];
  const items: FeedItem[] = [];
  for (const b of blocks) {
    const title = plainText(tag(b, "title") ?? "");
    const url = isAtom ? safeUrl(attr(b, "link", "href", /rel=["']alternate["']|^(?![\s\S]*rel=)/i) ?? attr(b, "link", "href")) : safeUrl(tag(b, "link") ?? tag(b, "guid"));
    if (!title || !url) continue;
    const summary = plainText(tag(b, isAtom ? "summary" : "description") ?? tag(b, "content") ?? "").slice(0, 400);
    const imageUrl = safeUrl(attr(b, "media:content", "url") ?? attr(b, "media:thumbnail", "url") ?? attr(b, "enclosure", "url", /type=["']image\//i));
    const publishedAt = date(tag(b, isAtom ? "published" : "pubDate") ?? tag(b, "updated") ?? tag(b, "dc:date"));
    items.push({ title: title.slice(0, 300), url, summary, imageUrl, publishedAt });
  }
  return items;
}

// Mots qui signalent une opportunité concrète pour un joueur, dans les 5 langues du site.
const OPPORTUNITY = /\b(d[ée]tections?|essais?\s+(de\s+)?(recrutement|club|joueurs?)|journ[ée]e\s+de\s+d[ée]tection|stage\s+de\s+(d[ée]tection|recrutement)|recrute(nt)?\s+des\s+joueurs|open\s+trials?|trials?\s+(day|open|for)|try-?outs?|talent\s+(id|hunt|scouting)|scouting\s+(camp|combine)|pruebas?\s+(de\s+)?(f[úu]tbol|jugadores|acceso)|captaci[óo]n|peneiras?|seletivas?|avalia[çc][ãa]o\s+de\s+atletas)(?![\w\u00C0-\u017F])/i;
// L'arabe n'a pas de « limite de mot » au sens des expressions régulières : recherche directe.
const OPPORTUNITY_AR = /(اختبارات|اختبار لاعبين|كشف المواهب|انتقاء)/;

export type NewsKind = "OPPORTUNITY" | "NEWS";

export function classify(item: Pick<FeedItem, "title" | "summary">): NewsKind {
  const text = `${item.title} ${item.summary}`;
  return OPPORTUNITY.test(text) || OPPORTUNITY_AR.test(text) ? "OPPORTUNITY" : "NEWS";
}
