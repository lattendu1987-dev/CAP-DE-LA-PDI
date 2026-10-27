import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MEDIA_RULES, type MediaKind } from "./domain/media";
import { createStreamUpload, deleteStreamVideo, STREAM_MAX_BYTES, streamEnabled, streamPlayerUrl } from "./cf-stream";

/**
 * Stockage des fichiers envoyés (vidéos, photos).
 * - Production : tout service compatible S3 (Cloudflare R2 recommandé : pas de frais de bande passante).
 * - Développement : dossier local ./uploads, servi par /api/media.
 */
export const s3Enabled = () =>
  !!(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY && process.env.S3_PUBLIC_URL);

let client: S3Client | null = null;
function s3() {
  client ??= new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  });
  return client;
}

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR || "uploads");
const secret = () => process.env.AUTH_SECRET || "dev-secret";

export function localSignature(key: string, exp: number, type: string, size: number) {
  return createHmac("sha256", secret()).update(`${key}|${exp}|${type}|${size}`).digest("base64url");
}

export function checkLocalSignature(key: string, exp: number, type: string, size: number, sig: string) {
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = Buffer.from(localSignature(key, exp, type, size));
  const given = Buffer.from(sig);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Chemin local sûr (empêche toute sortie du dossier d'envoi). */
export function localPath(key: string) {
  if (!/^u\/[\w-]+\/(video|photo|ad)\/[\w-]+\.\w{2,5}$/.test(key)) return null;
  return path.join(uploadDir(), key);
}

export function publicUrl(key: string) {
  return s3Enabled() ? `${process.env.S3_PUBLIC_URL!.replace(/\/$/, "")}/${key}` : `/api/media/${key}`;
}

export async function createUpload(userId: string, kind: MediaKind, contentType: string, size: number) {
  const rule = MEDIA_RULES[kind];
  const ext = rule.types[contentType];
  if (!ext) return { ok: false as const, error: "type" as const };
  if (!Number.isInteger(size) || size <= 0 || size > rule.maxBytes) return { ok: false as const, error: "size" as const };
  if (kind === "video" && streamEnabled()) {
    // Vidéo envoyée à Cloudflare Stream (formulaire multipart, 200 Mo maximum).
    if (size > STREAM_MAX_BYTES) return { ok: false as const, error: "size" as const };
    const { uploadURL, uid } = await createStreamUpload(userId);
    return { ok: true as const, key: `stream:${uid}`, uploadUrl: uploadURL, method: "POST_FORM" as const, publicUrl: streamPlayerUrl(uid) };
  }
  const key = `u/${userId}/${kind}/${randomBytes(12).toString("base64url")}.${ext}`;
  if (s3Enabled()) {
    const uploadUrl = await getSignedUrl(
      s3(),
      new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType, ContentLength: size }),
      { expiresIn: 3600 },
    );
    return { ok: true as const, key, uploadUrl, method: "PUT" as const, publicUrl: publicUrl(key) };
  }
  const exp = Date.now() + 3600_000;
  const qs = new URLSearchParams({ key, exp: String(exp), type: contentType, size: String(size), sig: localSignature(key, exp, contentType, size) });
  return { ok: true as const, key, uploadUrl: `/api/media/upload?${qs}`, method: "PUT" as const, publicUrl: publicUrl(key) };
}

/** Taille réelle du fichier stocké, ou null s'il n'existe pas. */
export async function storedSize(key: string): Promise<number | null> {
  try {
    if (s3Enabled()) {
      const head = await s3().send(new HeadObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
      return head.ContentLength ?? null;
    }
    const p = localPath(key);
    return p ? (await stat(p)).size : null;
  } catch {
    return null;
  }
}

export async function deleteStored(key: string | null | undefined) {
  if (!key) return;
  if (key.startsWith("stream:")) return deleteStreamVideo(key.slice(7));
  try {
    if (s3Enabled()) await s3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    else {
      const p = localPath(key);
      if (p) await unlink(p);
    }
  } catch (e) {
    console.error("Suppression du fichier impossible", key, e);
  }
}

export async function ensureLocalDir(key: string) {
  const p = localPath(key);
  if (p) await mkdir(path.dirname(p), { recursive: true });
  return p;
}
