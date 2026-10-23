import { describe, expect, it } from "vitest";
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
