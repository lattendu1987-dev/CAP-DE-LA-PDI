"use client";
// Compression de la vidéo directement sur le téléphone avant l'envoi (WebCodecs, via mediabunny).
// En 3G, une vidéo de 150 Mo devient ~30 Mo : l'envoi est 5 fois plus rapide.
import { compressionTarget, outputSize, shouldCompress } from "./domain/compression";

export type CompressResult = { file: File; compressed: boolean };

// Combinaisons essayées dans l'ordre : la plus compatible d'abord.
const PROFILES = [
  { container: "mp4", video: "avc", audio: "aac" },
  { container: "mp4", video: "avc", audio: "opus" },
  { container: "webm", video: "vp9", audio: "opus" },
] as const;

export async function compressVideo(file: File, onProgress: (pct: number) => void, signal?: AbortSignal): Promise<CompressResult> {
  if (typeof window === "undefined" || !("VideoEncoder" in window)) return { file, compressed: false };
  const mb = await import("mediabunny");
  const input = new mb.Input({ source: new mb.BlobSource(file), formats: mb.ALL_FORMATS });
  const track = await input.getPrimaryVideoTrack();
  if (!track) return { file, compressed: false };
  const duration = await input.computeDuration();
  if (!shouldCompress(file.size, duration)) return { file, compressed: false };

  const target = compressionTarget(duration);
  const size = outputSize(track.displayWidth, track.displayHeight, target.maxSide);

  for (const profile of PROFILES) {
    const output = new mb.Output({
      format: profile.container === "mp4" ? new mb.Mp4OutputFormat({ fastStart: "in-memory" }) : new mb.WebMOutputFormat(),
      target: new mb.BufferTarget(),
    });
    const conversion = await mb.Conversion.init({
      input,
      output,
      tracks: "primary",
      video: { width: size.width, height: size.height, fit: "contain", codec: profile.video, quality: new mb.Quality({ bitrate: target.videoBitrate }), frameRate: 30 },
      audio: { codec: profile.audio, bitrate: target.audioBitrate, numberOfChannels: 2 },
      showWarnings: false,
    });
    // Le son ne doit pas être perdu en route : on passe au profil suivant s'il ne peut pas être encodé.
    const audioLost = conversion.discardedTracks.some((d) => d.track.type === "audio" && d.reason !== "discarded_by_user");
    if (!conversion.isValid || audioLost) continue;
    conversion.onProgress = (p) => onProgress(Math.round(p * 100));
    signal?.addEventListener("abort", () => void conversion.cancel());
    await conversion.execute();
    const buffer = output.target.buffer;
    if (!buffer || buffer.byteLength >= file.size) return { file, compressed: false };
    const mp4 = profile.container === "mp4";
    const name = file.name.replace(/\.[^.]+$/, "") + (mp4 ? ".mp4" : ".webm");
    return { file: new File([buffer], name, { type: mp4 ? "video/mp4" : "video/webm" }), compressed: true };
  }
  return { file, compressed: false };
}
