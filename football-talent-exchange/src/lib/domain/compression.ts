// Réglages de compression vidéo (côté téléphone), selon la durée.
export interface CompressionTarget {
  maxSide: number; // plus grand côté en pixels
  videoBitrate: number; // bits par seconde
  audioBitrate: number;
}

export function compressionTarget(durationSeconds: number): CompressionTarget {
  if (durationSeconds <= 10 * 60) return { maxSide: 1280, videoBitrate: 1_800_000, audioBitrate: 96_000 }; // 720p : highlights
  if (durationSeconds <= 30 * 60) return { maxSide: 960, videoBitrate: 1_000_000, audioBitrate: 64_000 }; // 540p
  return { maxSide: 640, videoBitrate: 340_000, audioBitrate: 32_000 }; // 360p : match complet (90 min ≈ 250 Mo)
}

/** Taille estimée du fichier compressé, en octets. */
export function estimatedSize(durationSeconds: number, t: CompressionTarget = compressionTarget(durationSeconds)): number {
  return Math.round((durationSeconds * (t.videoBitrate + t.audioBitrate)) / 8);
}

/** Compresser seulement si le gain attendu est réel (fichier lourd ou débit élevé). */
export function shouldCompress(fileBytes: number, durationSeconds: number): boolean {
  if (!durationSeconds || durationSeconds <= 0) return fileBytes > 20 * 1024 * 1024;
  return estimatedSize(durationSeconds) < fileBytes * 0.8;
}

/** Dimensions de sortie (paires, requises par l'encodeur H.264), sans jamais agrandir. */
export function outputSize(width: number, height: number, maxSide: number): { width: number; height: number } {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const even = (n: number) => Math.max(2, Math.round((n * scale) / 2) * 2);
  return { width: even(width), height: even(height) };
}
