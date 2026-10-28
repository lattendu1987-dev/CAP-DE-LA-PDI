import { describe, expect, it } from "vitest";
import { mergeCv } from "@/lib/domain/cv-merge";
import { adMatches, adPriceCents, moderateAd } from "@/lib/domain/ads";
import { classify, parseFeed } from "@/lib/domain/feeds";
import { commissionFor, availableAtFrom, normalizeReferralCode, newReferralCode, REFERRAL_RATE } from "@/lib/domain/referral";
import { localAmount, fxRates, MOBILE_MONEY } from "@/lib/domain/mobile-money";
import { eligibleAge, isOpen, validTrialDates } from "@/lib/domain/trials";
import { ownsKey, MEDIA_RULES } from "@/lib/domain/media";
import { parseVideoUrl } from "@/lib/domain/video";
import { pickLocale, isLocale } from "@/i18n/config";
import { detectScam } from "@/lib/domain/scam";

describe("parrainage", () => {
  const signup = new Date(Date.UTC(2026, 0, 15));
  it("verse 20 % pendant 12 mois", () => {
    expect(REFERRAL_RATE).toBe(0.2);
    expect(commissionFor(4900, signup, new Date(Date.UTC(2026, 5, 1)))).toBe(980);
    expect(commissionFor(4900, signup, new Date(Date.UTC(2027, 0, 16)))).toBe(0);
    expect(commissionFor(0, signup, signup)).toBe(0);
  });
  it("bloque la commission 30 jours", () => {
    expect(availableAtFrom(signup).getTime() - signup.getTime()).toBe(30 * 86400000);
  });
  it("valide les codes", () => {
    expect(normalizeReferralCode(" ab12cd34 ")).toBe("AB12CD34");
    expect(normalizeReferralCode("x")).toBeNull();
    expect(normalizeReferralCode("<script>")).toBeNull();
    expect(newReferralCode()).toMatch(/^[A-Z2-9]{8}$/);
  });
});

describe("mobile money", () => {
  it("convertit en prix ronds en devise locale", () => {
    const rates = fxRates(undefined);
    expect(localAmount(300, "XOF", rates)).toBe(1800); // 3 $ -> 1800 FCFA
    expect(localAmount(1700, "XOF", rates) % 50).toBe(0);
    expect(localAmount(300, "KES", rates)).toBe(390);
  });
  it("accepte des taux personnalisés", () => {
    expect(fxRates('{"XOF":650}').XOF).toBe(650);
    expect(fxRates("pas du json").XOF).toBe(600);
  });
  it("couvre l'Afrique francophone et anglophone", () => {
    for (const c of ["SN", "CI", "CM", "GH", "KE"]) expect(MOBILE_MONEY[c]).toBeDefined();
    expect(MOBILE_MONEY.FR).toBeUndefined();
  });
});

describe("détections", () => {
  const trial = { minAge: 16, maxAge: 19, startsAt: new Date(Date.UTC(2026, 11, 1)), deadline: new Date(Date.UTC(2026, 10, 20)) };
  it("vérifie l'âge au jour de la détection", () => {
    expect(eligibleAge(trial, new Date(Date.UTC(2009, 0, 1)))).toBe(true); // 17 ans
    expect(eligibleAge(trial, new Date(Date.UTC(2005, 0, 1)))).toBe(false); // 21 ans
    expect(eligibleAge({ ...trial, minAge: null, maxAge: null }, new Date(Date.UTC(1990, 0, 1)))).toBe(true);
  });
  it("ferme après la date limite", () => {
    expect(isOpen(trial, new Date(Date.UTC(2026, 10, 1)))).toBe(true);
    expect(isOpen(trial, new Date(Date.UTC(2026, 10, 21)))).toBe(false);
    expect(validTrialDates(trial.startsAt, trial.deadline, new Date(Date.UTC(2026, 9, 1)))).toBe(true);
    expect(validTrialDates(trial.deadline, trial.startsAt, new Date(Date.UTC(2026, 9, 1)))).toBe(false);
  });
});

describe("fichiers envoyés", () => {
  it("n'accepte que les clés de l'utilisateur", () => {
    expect(ownsKey("u/abc123/video/xYz_-9.mp4", "abc123", "video")).toBe(true);
    expect(ownsKey("u/other/video/x.mp4", "abc123", "video")).toBe(false);
    expect(ownsKey("u/abc123/photo/x.jpg", "abc123", "video")).toBe(false);
    expect(ownsKey("u/abc123/video/../../etc.mp4", "abc123", "video")).toBe(false);
  });
  it("lit les vidéos stockées localement", () => {
    expect(parseVideoUrl("/api/media/u/abc/video/k-1.mov")?.provider).toBe("file");
    expect(parseVideoUrl("/api/media/../secret")).toBeNull();
    expect(MEDIA_RULES.video.types["video/quicktime"]).toBe("mov");
  });
});

describe("langues", () => {
  it("choisit la langue du navigateur", () => {
    expect(pickLocale("pt-BR,pt;q=0.9,en;q=0.8")).toBe("pt");
    expect(pickLocale("de-DE,ar;q=0.5")).toBe("ar");
    expect(pickLocale("de-DE")).toBe("fr");
    expect(pickLocale(null)).toBe("fr");
    expect(isLocale("es")).toBe(true);
    expect(isLocale("xx")).toBe(false);
  });
  it("détecte les arnaques dans plusieurs langues", () => {
    expect(detectScam("Para la prueba debes pagar la inscripción")).not.toEqual([]);
    expect(detectScam("يجب دفع رسوم التجربة")).not.toEqual([]);
    expect(detectScam("You must pay the trial fee of 200 USD")).not.toEqual([]);
  });
});

import { dictionaries } from "@/i18n/messages";

describe("dictionnaires", () => {
  // Compare la forme (clés, longueurs de listes, types) de chaque langue avec le français.
  const shape = (v: unknown): unknown =>
    Array.isArray(v) ? v.map(shape) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shape(x)])) : typeof v;
  for (const lang of ["en", "es", "pt", "ar"] as const) {
    it(`${lang} a exactement les mêmes textes que le français`, () => {
      expect(shape(dictionaries[lang])).toEqual(shape(dictionaries.fr));
    });
  }
});

import { compressionTarget, estimatedSize, outputSize, shouldCompress } from "@/lib/domain/compression";

describe("compression vidéo", () => {
  it("adapte la qualité à la durée", () => {
    expect(compressionTarget(120).maxSide).toBe(1280);
    expect(compressionTarget(20 * 60).maxSide).toBe(960);
    expect(compressionTarget(90 * 60).maxSide).toBe(640);
    // Un match complet de 90 min tient sous la limite de 300 Mo.
    expect(estimatedSize(90 * 60)).toBeLessThan(300 * 1024 * 1024);
  });
  it("ne compresse que si le gain est réel", () => {
    expect(shouldCompress(150 * 1024 * 1024, 180)).toBe(true); // 150 Mo pour 3 min
    expect(shouldCompress(30 * 1024 * 1024, 180)).toBe(false); // déjà léger
  });
  it("réduit sans déformer ni agrandir", () => {
    expect(outputSize(1920, 1080, 1280)).toEqual({ width: 1280, height: 720 });
    expect(outputSize(1080, 1920, 1280)).toEqual({ width: 720, height: 1280 }); // vidéo verticale
    expect(outputSize(640, 360, 1280)).toEqual({ width: 640, height: 360 });
    expect(outputSize(1281, 721, 1280).width % 2).toBe(0);
  });
  it("lit les vidéos Cloudflare Stream", () => {
    const uid = "a".repeat(32);
    expect(parseVideoUrl(`https://iframe.videodelivery.net/${uid}`)?.provider).toBe("stream");
    expect(parseVideoUrl(`https://customer-abc123.cloudflarestream.com/${uid}/iframe`)?.embedUrl).toBe(`https://iframe.videodelivery.net/${uid}`);
    expect(parseVideoUrl("https://iframe.videodelivery.net/pas-un-id")).toBeNull();
  });
});

import { isAllowedPushEndpoint, isValidSubscription, safeInternalPath } from "@/lib/domain/push";

describe("notifications sur le téléphone", () => {
  it("n'accepte que les services de notification officiels", () => {
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/x")).toBe(true);
    expect(isAllowedPushEndpoint("https://web.push.apple.com/QAbc")).toBe(true);
    expect(isAllowedPushEndpoint("https://wns2-par02p.notify.windows.com/w/?token=x")).toBe(true);
    expect(isAllowedPushEndpoint("https://evil.com/fcm.googleapis.com")).toBe(false);
    expect(isAllowedPushEndpoint("https://fcm.googleapis.com.evil.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://user:pw@fcm.googleapis.com/x")).toBe(false);
    expect(isAllowedPushEndpoint("http://169.254.169.254/latest")).toBe(false);
    expect(isAllowedPushEndpoint("http://localhost:4599/x")).toBe(false);
    expect(isAllowedPushEndpoint("https://localhost:4599/x", true)).toBe(true);
    expect(isAllowedPushEndpoint("https://localhost:4599/x")).toBe(false);
  });
  it("valide la forme de l'abonnement", () => {
    const ok = { endpoint: "https://fcm.googleapis.com/fcm/send/abc", keys: { p256dh: "BNcR_abc-123", auth: "tBHI_tw" } };
    expect(isValidSubscription(ok)).toBe(true);
    expect(isValidSubscription({ ...ok, keys: { p256dh: "<script>", auth: "x" } })).toBe(false);
    expect(isValidSubscription({ endpoint: ok.endpoint })).toBe(false);
    expect(isValidSubscription(null)).toBe(false);
  });
  it("n'ouvre que des pages du site", () => {
    expect(safeInternalPath("/messages/1")).toBe("/messages/1");
    expect(safeInternalPath("//evil.com")).toBe("/");
    expect(safeInternalPath("https://evil.com")).toBe("/");
  });
});

describe("veille d'actualités : lecture des flux et tri", () => {
  const rss = `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>T</title>
    <item><title><![CDATA[Journée de détection U17 à Dakar &amp; Thiès]]></title><link>https://exemple.sn/detection-u17</link>
      <description>&lt;p&gt;Le club organise une &lt;b&gt;détection&lt;/b&gt; gratuite.&lt;/p&gt;</description><pubDate>Mon, 26 Oct 2026 09:00:00 GMT</pubDate>
      <media:content url="https://exemple.sn/photo.jpg" medium="image"/></item>
    <item><title>Résultats du week-end</title><link>javascript:alert(1)</link></item>
    <item><title>Le derby se termine sur un nul</title><link>https://exemple.com/derby</link></item>
  </channel></rss>`;
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Open trials for U21 players</title>
    <link rel="alternate" href="https://example.com/trials"/><summary>Academy tryouts this Saturday.</summary><published>2026-10-25T10:00:00Z</published></entry></feed>`;

  it("lit le RSS : titre nettoyé, lien sûr, résumé sans HTML, image, date", () => {
    const items = parseFeed(rss);
    expect(items).toHaveLength(2); // le lien « javascript: » est rejeté
    expect(items[0]).toMatchObject({ title: "Journée de détection U17 à Dakar & Thiès", url: "https://exemple.sn/detection-u17", summary: "Le club organise une détection gratuite.", imageUrl: "https://exemple.sn/photo.jpg" });
    expect(items[0].publishedAt?.toISOString()).toBe("2026-10-26T09:00:00.000Z");
  });
  it("lit l'Atom", () => {
    expect(parseFeed(atom)[0]).toMatchObject({ title: "Open trials for U21 players", url: "https://example.com/trials" });
  });
  it("distingue les opportunités des actualités, dans plusieurs langues", () => {
    expect(classify({ title: "Journée de détection U17 à Dakar", summary: "" })).toBe("OPPORTUNITY");
    expect(classify({ title: "Open trials for U21 players", summary: "" })).toBe("OPPORTUNITY");
    expect(classify({ title: "Peneira do clube neste sábado", summary: "" })).toBe("OPPORTUNITY");
    expect(classify({ title: "Pruebas de fútbol para juveniles", summary: "" })).toBe("OPPORTUNITY");
    expect(classify({ title: "اختبارات لاعبين في الدار البيضاء", summary: "" })).toBe("OPPORTUNITY");
    expect(classify({ title: "Le derby se termine sur un nul", summary: "" })).toBe("NEWS");
  });
});

describe("régie publicitaire : prix et validation automatique", () => {
  it("calcule le prix selon le format, la durée et le ciblage", () => {
    expect(adPriceCents("BANNER", 7, 2)).toBe(2100);
    expect(adPriceCents("INTERSTITIAL", 14, 1)).toBe(8400);
    expect(adPriceCents("BANNER", 30, 0)).toBe(13500); // monde entier : +50 %
  });
  it("accepte une annonce correcte", () => {
    expect(moderateAd({ headline: "Crampons pro à -20 % pour la rentrée", linkUrl: "https://boutique-foot.sn/crampons", mediaType: "image" })).toEqual([]);
  });
  it("refuse les liens douteux, les secteurs interdits et les arnaques", () => {
    expect(moderateAd({ headline: "Super offre", linkUrl: "http://site.com", mediaType: "image" })).toContain("link");
    expect(moderateAd({ headline: "Super offre", linkUrl: "https://bit.ly/abc", mediaType: "image" })).toContain("shortener");
    expect(moderateAd({ headline: "Paris sportifs : bonus de bienvenue", linkUrl: "https://exemple.com", mediaType: "image" })).toContain("forbidden");
    expect(moderateAd({ headline: "Essai en Europe, envoie 300 € par Western Union", linkUrl: "https://exemple.com", mediaType: "image" })).toContain("scam");
    expect(moderateAd({ headline: "OK", linkUrl: "https://exemple.com", mediaType: null })).toEqual(expect.arrayContaining(["headline", "media"]));
  });
  it("cible les bons visiteurs", () => {
    const ad = { audience: "RECRUITERS" as const, countries: ["SN", "CI"] };
    expect(adMatches(ad, { country: "SN", role: "RECRUITER" })).toBe(true);
    expect(adMatches(ad, { country: "SN", role: "PLAYER" })).toBe(false);
    expect(adMatches(ad, { country: "FR", role: "RECRUITER" })).toBe(false);
    expect(adMatches({ audience: "ALL", countries: [] }, { country: null, role: null })).toBe(true);
  });
});

describe("import de CV : fusion prudente avec le profil", () => {
  const empty = { heightCm: null, weightKg: null, foot: null, mainPosition: null, otherPositions: [], currentLevel: null, city: null, nationalities: [], languages: [], bio: null };
  const cv = {
    heightCm: 178, weightKg: 300, foot: "LEFT" as const, mainPosition: "AG", otherPositions: ["AG", "AD", "XX"], currentLevel: "SEMI_PRO", city: " Thiès ",
    nationalities: ["sn", "ZZ"], languages: ["Français", "Wolof", "Français"],
    career: [
      { club: "AS Douanes", kind: "CLUB", country: "sn", startYear: 2021, endYear: null },
      { club: "Académie Génération Foot", kind: "ACADEMY", country: "SN", startYear: 2016, endYear: 2021 },
      { club: "Club du futur", kind: "CLUB", country: null, startYear: 2099, endYear: null },
    ],
    stats: [{ season: "2024-2025", club: "AS Douanes", matches: 24, goals: 9, assists: 5, minutes: null }, { season: "2023-2024", club: "AS Douanes", matches: 0, goals: 0, assists: 0, minutes: null }],
    summary: "Ailier gauche rapide, formé à l'académie Génération Foot.",
  };
  it("remplit les champs vides et rejette les valeurs aberrantes", () => {
    const r = mergeCv(empty, { career: [], stats: [] }, cv, 2026);
    expect(r.data).toMatchObject({ heightCm: 178, foot: "LEFT", mainPosition: "AG", otherPositions: ["AD"], currentLevel: "SEMI_PRO", city: "Thiès", nationalities: ["SN"], languages: ["Français", "Wolof"] });
    expect(r.data).not.toHaveProperty("weightKg"); // 300 kg : refusé
    expect(r.career.map((c) => c.club)).toEqual(["AS Douanes", "Académie Génération Foot"]); // année future : refusée
    expect(r.stats).toHaveLength(1); // saison sans match : ignorée
  });
  it("ne remplace jamais ce que le joueur a déjà saisi et ne crée pas de doublon", () => {
    const r = mergeCv({ ...empty, heightCm: 181, bio: "Ma présentation." }, { career: [{ club: "AS DOUANES", startYear: 2021 }], stats: [{ season: "2024-2025", club: "AS Douanes" }] }, cv, 2026);
    expect(r.data).not.toHaveProperty("heightCm");
    expect(r.data).not.toHaveProperty("bio");
    expect(r.career.map((c) => c.club)).toEqual(["Académie Génération Foot"]);
    expect(r.stats).toHaveLength(0);
  });
});

describe("import de CV : codes inattendus ignorés", () => {
  it("garde le reste du CV quand l'IA renvoie un code inconnu", () => {
    const empty = { heightCm: null, weightKg: null, foot: null, mainPosition: null, otherPositions: [], currentLevel: null, city: null, nationalities: [], languages: [], bio: null };
    const r = mergeCv(empty, { career: [], stats: [] }, {
      heightCm: 180, weightKg: null, foot: "GAUCHER", mainPosition: "STRIKER", otherPositions: [], currentLevel: "LIGUE1", city: null, nationalities: [], languages: [],
      career: [{ club: "FC Test", kind: "EQUIPE", country: null, startYear: 2020, endYear: 2022 }], stats: [], summary: null,
    }, 2026);
    expect(r.data).toEqual({ heightCm: 180 });
    expect(r.career[0]).toMatchObject({ club: "FC Test", kind: "CLUB" });
  });
});
