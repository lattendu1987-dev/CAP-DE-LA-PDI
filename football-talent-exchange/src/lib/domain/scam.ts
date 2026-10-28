// Détection des demandes d'argent typiques des fausses offres d'essai.
const PATTERNS: { flag: string; re: RegExp }[] = [
  { flag: "frais", re: /\b(frais|fees?|cuota|taxa)\s+(d['’]?\s*)?(essai|trial|inscription|registration|dossier|visa|billet|ticket|agent|licen[cs]e)/i },
  { flag: "paiement", re: /\b(paie[rz]?|payer|pay|envoie[rz]?|send|transf[ée]r\w*|virement|deposit|d[ée]p[ôo]t|avance)\b.{0,40}\b(\d+\s?(€|\$|usd|eur|cad|fcfa|xof|euros?|dollars?)|argent|money)/i },
  { flag: "transfert-argent", re: /\b(western\s?union|moneygram|ria|wave|orange\s?money|mtn\s?money|crypto|bitcoin|usdt|carte\s+cadeau|gift\s?card)\b/i },
  { flag: "documents", re: /\b(passeport|passport)\b.{0,40}\b(envoie|send|copie|copy|scan)/i },
  { flag: "frais", re: /\b(pagar|pague|paga)\b.{0,40}\b(inscripci[óo]n|inscri[çc][ãa]o|prueba|teste|visa|visto|pasaje|passagem)/i },
  { flag: "frais", re: /(رسوم|ادفع|دفع|تحويل).{0,40}(تجربة|اختبار|تأشيرة|فيزا|تذكرة)/ },
  { flag: "urgence", re: /\b(urgent|dernière chance|last chance|aujourd['’]hui seulement|within 24 ?h|sous 24 ?h)\b/i },
];

export function detectScam(text: string): string[] {
  const flags = new Set<string>();
  for (const p of PATTERNS) if (p.re.test(text)) flags.add(p.flag);
  // "urgence" seule n'est pas suspecte.
  if (flags.size === 1 && flags.has("urgence")) return [];
  return [...flags];
}
