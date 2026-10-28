import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { checkLocalSignature, ensureLocalDir, s3Enabled } from "@/lib/storage";

export const runtime = "nodejs";

// Réception des fichiers en mode local (sans S3). Même principe qu'une URL signée S3.
export async function PUT(req: Request) {
  if (s3Enabled()) return new Response("Désactivé", { status: 404 });
  const u = new URL(req.url);
  const key = u.searchParams.get("key") ?? "";
  const exp = Number(u.searchParams.get("exp"));
  const type = u.searchParams.get("type") ?? "";
  const size = Number(u.searchParams.get("size"));
  if (!checkLocalSignature(key, exp, type, size, u.searchParams.get("sig") ?? "")) return new Response("Signature invalide", { status: 403 });
  if (req.headers.get("content-type") !== type) return new Response("Type incorrect", { status: 400 });
  const target = await ensureLocalDir(key);
  if (!target || !req.body) return new Response("Clé invalide", { status: 400 });

  let written = 0;
  const limited = Readable.fromWeb(req.body as import("node:stream/web").ReadableStream).on("data", (c: Buffer) => {
    written += c.length;
    if (written > size) limited.destroy(new Error("Trop gros"));
  });
  try {
    await pipeline(limited, createWriteStream(target));
  } catch {
    await unlink(target).catch(() => {});
    return new Response("Envoi interrompu", { status: 400 });
  }
  if (written !== size) {
    await unlink(target).catch(() => {});
    return new Response("Taille incorrecte", { status: 400 });
  }
  return new Response(null, { status: 200 });
}
