import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentUser } from "@/lib/auth";
import { MEDIA_RULES, ownsKey, type MediaKind } from "@/lib/domain/media";

export const runtime = "nodejs";

// Autorise un envoi direct du téléphone vers Vercel Blob : seulement pour l'utilisateur connecté,
// dans son propre dossier, avec les types et la taille prévus pour ce genre de fichier.
const ALLOWED: Record<string, MediaKind[]> = { PLAYER: ["video", "photo", "cv"], ADVERTISER: ["ad"] };

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser();
        const kind = pathname.split("/")[2] as MediaKind;
        if (!user || !(ALLOWED[user.role] ?? []).includes(kind) || !ownsKey(pathname, user.id, kind)) throw new Error("Envoi non autorisé");
        const rule = MEDIA_RULES[kind];
        return { allowedContentTypes: Object.keys(rule.types), maximumSizeInBytes: rule.maxBytes, addRandomSuffix: false };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
