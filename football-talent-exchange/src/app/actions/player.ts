"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getMessages } from "@/i18n/server";
import { CAREER_KINDS, LEVEL_CODES, POSITION_CODES } from "@/lib/domain/reference";
import { parseTimestamp, parseVideoUrl } from "@/lib/domain/video";
import { FREE_VIDEO_LIMIT } from "@/lib/domain/pricing";
import { isPremiumPlayer } from "@/lib/domain/rules";
import { MEDIA_RULES, ownsKey } from "@/lib/domain/media";
import { deleteStored, publicUrl, storedSize } from "@/lib/storage";

const back = (msg: string, err = false, anchor = ""): never =>
  redirect(`/joueur?${err ? "erreur" : "ok"}=${encodeURIComponent(msg)}${anchor ? `#${anchor}` : ""}`);

async function ctx() {
  const user = await requireUser(["PLAYER"]);
  if (!user.player) redirect("/");
  return { user, player: user.player, m: await getMessages() };
}

const posCodes = POSITION_CODES as readonly string[];
const levelCodes = LEVEL_CODES as readonly string[];
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().int().min(min).max(max).optional());
const list = (fd: FormData, k: string, max = 10) =>
  String(fd.get(k) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);

export async function updateProfileAction(fd: FormData) {
  const { player, m } = await ctx();
  const schema = z.object({
    firstName: z.string().trim().min(1).max(60),
    lastName: z.string().trim().min(1).max(60),
    city: z.string().trim().max(80).optional(),
    country: z.string().length(2),
    bio: z.string().trim().max(1500).optional(),
    heightCm: optInt(120, 230),
    weightKg: optInt(35, 150),
    foot: z.enum(["RIGHT", "LEFT", "BOTH"]).optional().or(z.literal("")),
    currentLevel: z.string().optional(),
    contractStatus: z.enum(["FREE", "UNDER_CONTRACT"]),
    contractEnd: z.string().optional(),
    availability: z.enum(["IMMEDIATE", "END_OF_SEASON", "TRIAL_ONLY", "NOT_AVAILABLE"]),
  });
  const r = schema.safeParse(Object.fromEntries(fd));
  if (!r.success) back(m.player.flash.invalidField(r.error!.issues[0].path.join(".")), true);
  const d = r.data!;
  const mainPosition = String(fd.get("mainPosition") ?? "");
  const otherPositions = fd.getAll("otherPositions").map(String).filter((p) => posCodes.includes(p) && p !== mainPosition).slice(0, 4);

  await db.playerProfile.update({
    where: { id: player.id },
    data: {
      firstName: d.firstName,
      lastName: d.lastName,
      city: d.city || null,
      country: d.country,
      bio: d.bio || null,
      heightCm: d.heightCm ?? null,
      weightKg: d.weightKg ?? null,
      foot: d.foot ? d.foot : null,
      mainPosition: posCodes.includes(mainPosition) ? mainPosition : null,
      otherPositions,
      currentLevel: d.currentLevel && levelCodes.includes(d.currentLevel) ? (d.currentLevel as never) : null,
      contractStatus: d.contractStatus,
      contractEnd: d.contractStatus === "UNDER_CONTRACT" && d.contractEnd ? new Date(d.contractEnd) : null,
      hasAgent: fd.get("hasAgent") === "on",
      availability: d.availability,
      willingToRelocate: fd.get("willingToRelocate") === "on",
      nationalities: list(fd, "nationalities", 3).map((s) => s.toUpperCase().slice(0, 2)),
      languages: list(fd, "languages", 8),
      relocationCountries: list(fd, "relocationCountries", 20).map((s) => s.toUpperCase().slice(0, 2)),
    },
  });
  revalidatePath("/joueur");
  back(m.player.flash.saved);
}

export async function setPhotoAction(fd: FormData) {
  const { user, player, m } = await ctx();
  const key = String(fd.get("storageKey") ?? "");
  if (!ownsKey(key, user.id, "photo")) back(m.player.flash.uploadMissing, true, "infos");
  const size = await storedSize(key);
  if (!size || size > MEDIA_RULES.photo.maxBytes) back(m.player.flash.uploadMissing, true, "infos");
  await deleteStored(player.photoKey);
  await db.playerProfile.update({ where: { id: player.id }, data: { photoKey: key, photoUrl: publicUrl(key) } });
  back(m.player.flash.photoSaved, false, "infos");
}

export async function togglePublishedAction() {
  const { player, m } = await ctx();
  await db.playerProfile.update({ where: { id: player.id }, data: { published: !player.published } });
  back(player.published ? m.player.flash.hidden : m.player.flash.shown);
}

export async function addCareerAction(fd: FormData) {
  const { player, m } = await ctx();
  const r = z
    .object({
      club: z.string().trim().min(1).max(120),
      kind: z.enum(CAREER_KINDS),
      level: z.string().optional(),
      country: z.string().max(2).optional(),
      startYear: z.coerce.number().int().min(1990).max(2100),
      endYear: optInt(1990, 2100),
      notes: z.string().trim().max(300).optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) back(m.player.flash.careerInvalid, true, "parcours");
  const d = r.data!;
  if (d.endYear && d.endYear < d.startYear) back(m.player.flash.careerYears, true, "parcours");
  if ((await db.careerEntry.count({ where: { playerId: player.id } })) >= 30) back(m.player.flash.careerMax, true, "parcours");
  await db.careerEntry.create({
    data: {
      playerId: player.id, club: d.club, kind: d.kind, country: d.country || null, startYear: d.startYear, endYear: d.endYear ?? null, notes: d.notes || null,
      level: d.level && levelCodes.includes(d.level) ? (d.level as never) : null,
    },
  });
  back(m.player.flash.careerAdded, false, "parcours");
}

export async function deleteCareerAction(fd: FormData) {
  const { player, m } = await ctx();
  await db.careerEntry.deleteMany({ where: { id: String(fd.get("id")), playerId: player.id } });
  back(m.player.flash.careerDeleted, false, "parcours");
}

export async function addStatAction(fd: FormData) {
  const { player, m } = await ctx();
  const n = optInt(0, 10000);
  const r = z
    .object({
      season: z.string().trim().regex(/^\d{4}(-\d{2,4})?$/, "season"),
      club: z.string().trim().min(1).max(120),
      matches: n, minutes: n, goals: n, assists: n, yellowCards: n, redCards: n, cleanSheets: n, saves: n,
    })
    .safeParse(Object.fromEntries(fd));
  if (!r.success) back(r.error!.issues[0].message === "season" ? m.player.flash.seasonFormat : m.player.flash.statsInvalid, true, "stats");
  const { season, club, ...nums } = r.data!;
  if ((await db.seasonStat.count({ where: { playerId: player.id } })) >= 30) back(m.player.flash.statsMax, true, "stats");
  await db.seasonStat.create({
    data: { playerId: player.id, season, club, ...Object.fromEntries(Object.entries(nums).map(([k, v]) => [k, v ?? 0])) },
  });
  back(m.player.flash.statAdded, false, "stats");
}

export async function deleteStatAction(fd: FormData) {
  const { player, m } = await ctx();
  await db.seasonStat.deleteMany({ where: { id: String(fd.get("id")), playerId: player.id } });
  back(m.player.flash.statDeleted, false, "stats");
}

/** Ajoute une vidéo : lien externe, ou fichier envoyé directement (champ storageKey). */
export async function addVideoAction(fd: FormData) {
  const { user, player, m } = await ctx();
  const storageKey = String(fd.get("storageKey") ?? "");
  let url = String(fd.get("url") ?? "").trim();
  let sizeBytes: number | null = null;
  if (storageKey) {
    if (!ownsKey(storageKey, user.id, "video")) back(m.player.flash.uploadMissing, true, "videos");
    sizeBytes = await storedSize(storageKey);
    if (!sizeBytes || sizeBytes > MEDIA_RULES.video.maxBytes) back(m.player.flash.uploadMissing, true, "videos");
    url = publicUrl(storageKey);
  } else if (!parseVideoUrl(url)) {
    back(m.player.flash.videoBadUrl, true, "videos");
  }
  const title = String(fd.get("title") ?? "").trim().slice(0, 120) || "Video";
  const kind = fd.get("kind") === "FULL_MATCH" ? "FULL_MATCH" : "HIGHLIGHTS";
  const count = await db.video.count({ where: { playerId: player.id } });
  const limit = isPremiumPlayer(user.subscription) ? 50 : FREE_VIDEO_LIMIT;
  if (count >= limit) {
    if (storageKey) await deleteStored(storageKey);
    back(m.player.flash.videoLimit(limit), true, "videos");
  }

  // Une ligne par moment : "01:12 But du gauche"
  const moments = String(fd.get("moments") ?? "")
    .split("\n")
    .map((line) => line.trim().match(/^(\d{1,2}(?::\d{1,2}){1,2})\s*[-–—:]?\s*(.+)$/))
    .filter((x): x is RegExpMatchArray => !!x)
    .map((x) => ({ seconds: parseTimestamp(x[1]), label: x[2].slice(0, 80) }))
    .filter((x): x is { seconds: number; label: string } => x.seconds !== null)
    .slice(0, 30);

  await db.video.create({ data: { playerId: player.id, url, title, kind, storageKey: storageKey || null, sizeBytes, moments: { create: moments } } });
  back(m.player.flash.videoAdded, false, "videos");
}

export async function deleteVideoAction(fd: FormData) {
  const { player, m } = await ctx();
  const video = await db.video.findFirst({ where: { id: String(fd.get("id")), playerId: player.id } });
  if (video) {
    await db.video.delete({ where: { id: video.id } });
    await deleteStored(video.storageKey);
  }
  back(m.player.flash.videoDeleted, false, "videos");
}
