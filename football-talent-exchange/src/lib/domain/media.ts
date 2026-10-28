export type MediaKind = "video" | "photo" | "ad" | "cv";

export const MEDIA_RULES: Record<MediaKind, { maxBytes: number; types: Record<string, string> }> = {
  video: {
    maxBytes: 300 * 1024 * 1024,
    types: { "video/mp4": "mp4", "video/quicktime": "mov", "video/webm": "webm", "video/3gpp": "3gp" },
  },
  photo: {
    maxBytes: 8 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" },
  },
  // CV du joueur : PDF, Word ou photo du document papier.
  cv: {
    maxBytes: 10 * 1024 * 1024,
    types: {
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
    },
  },
  // Visuel publicitaire : image ou vidéo courte.
  ad: {
    maxBytes: 40 * 1024 * 1024,
    types: { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "video/mp4": "mp4", "video/webm": "webm" },
  },
};

export const MEDIA_CONTENT_TYPES: Record<string, string> = {
  mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm", "3gp": "video/3gpp", jpg: "image/jpeg", png: "image/png", webp: "image/webp",
  pdf: "application/pdf", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Clé de stockage appartenant à cet utilisateur et à ce type de média. */
export function ownsKey(key: string, userId: string, kind: MediaKind) {
  return new RegExp(`^u/${userId.replace(/[^\w-]/g, "")}/${kind}/[\\w-]+\\.\\w{2,5}$`).test(key);
}
