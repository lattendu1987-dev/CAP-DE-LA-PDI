"use server";
import { requireUser } from "@/lib/auth";
import { createUpload } from "@/lib/storage";
import type { MediaKind } from "@/lib/domain/media";

/** Prépare l'envoi direct d'un fichier : renvoie une URL d'envoi signée valable 1 heure. */
export async function requestUploadAction(kind: MediaKind, contentType: string, size: number) {
  const user = await requireUser(["PLAYER"]);
  if (kind !== "video" && kind !== "photo") return { ok: false as const, error: "type" as const };
  try {
    return await createUpload(user.id, kind, contentType, size);
  } catch (e) {
    console.error("Préparation de l'envoi impossible", e);
    return { ok: false as const, error: "failed" as const };
  }
}
