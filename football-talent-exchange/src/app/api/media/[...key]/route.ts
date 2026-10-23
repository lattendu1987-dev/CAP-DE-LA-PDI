import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { localPath } from "@/lib/storage";
import { MEDIA_CONTENT_TYPES } from "@/lib/domain/media";

export const runtime = "nodejs";

// Lecture des fichiers locaux, avec prise en charge des plages (avance rapide dans les vidéos).
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  const p = localPath(key);
  if (!p) return new Response("Introuvable", { status: 404 });
  let size: number;
  try {
    size = (await stat(p)).size;
  } catch {
    return new Response("Introuvable", { status: 404 });
  }
  const type = MEDIA_CONTENT_TYPES[key.split(".").pop() ?? ""] ?? "application/octet-stream";
  const headers: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "public, max-age=31536000, immutable" };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(p, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  return new Response(Readable.toWeb(createReadStream(p)) as ReadableStream, { headers: { ...headers, "Content-Length": String(size) } });
}
