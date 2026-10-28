"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { MEDIA_RULES, ownsKey } from "@/lib/domain/media";
import { mergeCv, type CvData } from "@/lib/domain/cv-merge";
import { deleteStored, readStored, storedSize } from "@/lib/storage";
import { aiEnabled, extractCv, writeBio } from "@/lib/ai";
import { aiFake, FAKE_BIO, FAKE_CV } from "@/lib/ai-fake";
import { audit } from "@/lib/audit";
import { positionLabel, levelLabel, footLabel } from "@/lib/domain/reference";

const back = (msg: string, err = false, anchor = "cv"): never =>
  redirect(`/joueur?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}#${anchor}`);

/** Utilisations de l'IA par joueur et par jour (limite les abus et les coûts). */
const DAILY_AI_LIMIT = 10;
async function underAiLimit(userId: string) {
  const since = new Date(Date.now() - 86400000);
  return (await db.auditLog.count({ where: { actorId: userId, action: { in: ["ai.cv", "ai.bio"] }, createdAt: { gt: since } } })) < DAILY_AI_LIMIT;
}

async function readCvForAi(key: string, mime: string): Promise<{ data: Buffer; mime: string; text?: string } | null> {
  const data = await readStored(key);
  if (!data) return null;
  if (mime.includes("wordprocessingml")) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer: data });
    return { data, mime, text: value.slice(0, 60000) };
  }
  return { data, mime };
}

/** Dépôt du CV : enregistré sur le profil, puis lu par l'IA pour remplir ce qui manque. */
export async function importCvAction(fd: FormData) {
  const user = await requireUser(["PLAYER"]);
  if (!user.player) redirect("/");
  const m = await getMessages();
  const t = m.cvImport;
  const key = String(fd.get("storageKey") ?? "");
  const ext = key.split(".").pop() ?? "";
  const mime = Object.entries(MEDIA_RULES.cv.types).find(([, e]) => e === ext)?.[0];
  if (!ownsKey(key, user.id, "cv") || !mime || (await storedSize(key)) === null) back(t.invalid, true);
  const name = String(fd.get("fileName") ?? "").replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, 80) || `CV.${ext}`;

  const p = user.player!;
  if (p.cvKey && p.cvKey !== key) await deleteStored(p.cvKey);
  await db.playerProfile.update({ where: { id: p.id }, data: { cvKey: key, cvName: name, cvUploadedAt: new Date() } });
  await audit(user.id, "cv.upload", { ext });

  const fake = aiFake();
  if (!aiEnabled() && !fake) back(t.storedOnly);
  if (!(await underAiLimit(user.id))) back(t.limit, true);
  await audit(user.id, "ai.cv", {});

  let cv: CvData | null = null;
  try {
    if (fake) cv = FAKE_CV;
    else {
      const file = await readCvForAi(key, mime!);
      cv = file ? await extractCv(file, await getLocale()) : null;
    }
  } catch (e) {
    console.error("Lecture du CV par l'IA impossible", e);
  }
  if (!cv) back(t.unreadable, true);

  const full = await db.playerProfile.findUniqueOrThrow({ where: { id: p.id }, include: { career: { select: { club: true, startYear: true } }, stats: { select: { season: true, club: true } } } });
  const merged = mergeCv(full, { career: full.career, stats: full.stats }, cv!);
  await db.$transaction([
    db.playerProfile.update({ where: { id: p.id }, data: merged.data }),
    ...merged.career.map((c) => db.careerEntry.create({ data: { playerId: p.id, club: c.club, kind: c.kind, country: c.country, startYear: c.startYear, endYear: c.endYear } })),
    ...merged.stats.map((s) => db.seasonStat.create({ data: { playerId: p.id, season: s.season, club: s.club, matches: s.matches, goals: s.goals, assists: s.assists, minutes: s.minutes, verified: false } })),
  ]);
  await audit(user.id, "cv.imported", { fields: merged.filled, clubs: merged.career.length, seasons: merged.stats.length });
  if (merged.filled + merged.career.length + merged.stats.length === 0) back(t.nothingNew);
  back(t.imported(merged.filled, merged.career.length, merged.stats.length), false, "infos");
}

export async function removeCvAction() {
  const user = await requireUser(["PLAYER"]);
  if (!user.player) redirect("/");
  const m = await getMessages();
  await deleteStored(user.player.cvKey);
  await db.playerProfile.update({ where: { id: user.player.id }, data: { cvKey: null, cvName: null, cvUploadedAt: null } });
  back(m.cvImport.removed);
}

/**
 * Présentation rédigée par l'IA à partir du profil. Elle est proposée dans le formulaire (paramètre « bio »),
 * le joueur la relit et l'enregistre lui-même.
 */
export async function writeBioAction() {
  const user = await requireUser(["PLAYER"]);
  if (!user.player) redirect("/");
  const [m, locale] = await Promise.all([getMessages(), getLocale()]);
  const t = m.cvImport;
  const fake = aiFake();
  if (!aiEnabled() && !fake) back(t.bioFailed, true, "infos");
  if (!(await underAiLimit(user.id))) back(t.limit, true, "infos");
  const p = await db.playerProfile.findUniqueOrThrow({ where: { id: user.player.id }, include: { career: { orderBy: { startYear: "desc" }, take: 8 }, stats: { orderBy: { season: "desc" }, take: 6 } } });
  if (!p.mainPosition && p.career.length === 0 && p.stats.length === 0) back(t.bioFailed, true, "infos");
  await audit(user.id, "ai.bio", {});
  const facts = [
    `Poste : ${positionLabel(m, p.mainPosition)}${p.otherPositions.length ? ` (aussi ${p.otherPositions.map((c) => positionLabel(m, c)).join(", ")})` : ""}`,
    p.foot && `Pied : ${footLabel(m, p.foot)}`,
    p.heightCm && `Taille : ${p.heightCm} cm`,
    p.currentLevel && `Niveau : ${levelLabel(m, p.currentLevel)}`,
    p.city && `Ville : ${p.city}`,
    p.languages.length && `Langues : ${p.languages.join(", ")}`,
    ...p.career.map((c) => `Parcours : ${c.club} (${c.startYear}–${c.endYear ?? "aujourd'hui"})`),
    ...p.stats.map((s) => `Saison ${s.season}, ${s.club} : ${s.matches} matchs, ${s.goals} buts, ${s.assists} passes décisives`),
    p.bio && `Présentation actuelle : ${p.bio}`,
  ].filter(Boolean).join("\n");
  let bio: string | null = null;
  try {
    bio = fake ? FAKE_BIO : await writeBio(facts, locale);
  } catch (e) {
    console.error("Rédaction par l'IA impossible", e);
  }
  if (!bio) back(t.bioFailed, true, "infos");
  // Le texte est proposé dans le formulaire, rien n'est enregistré sans l'accord du joueur.
  redirect(`/joueur?ok=${encodeURIComponent(t.bioDone)}&bio=${encodeURIComponent(bio!)}#infos`);
}
