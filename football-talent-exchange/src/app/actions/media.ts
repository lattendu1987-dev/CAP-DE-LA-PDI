"use server";
import { requireUser } from "@/lib/auth";
import { createUpload } from "@/lib/storage";
import type { MediaKind } from "@/lib/domain/media";

/** Prépare l'envoi direct d'un fichier : renvoie une URL d'envoi signée valable 1 heure. */
export async function requestUploadAction(kind: MediaKind, contentType: string, size: number) {
  const user = await requireUser(["PLAYER"]);
  if (kind !== "video" && kind !== "photo") return { ok: false as const, error: "type" as const };
  return createUpload(user.id, kind, contentType, size);
}
