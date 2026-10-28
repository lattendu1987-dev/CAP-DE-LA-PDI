import { getCurrentUser } from "@/lib/auth";
import { canView, loadPlayerBySlug } from "@/lib/players";
import { readStored } from "@/lib/storage";
import { MEDIA_CONTENT_TYPES } from "@/lib/domain/media";

export const runtime = "nodejs";

// Téléchargement du CV : le joueur, son parent, l'équipe, ou un recruteur vérifié qui peut voir le profil.
// Le fichier passe par le site : son adresse de stockage n'est jamais montrée.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [viewer, p] = await Promise.all([getCurrentUser(), loadPlayerBySlug(slug)]);
  if (!p?.cvKey || !canView(p, viewer)) return new Response("Introuvable", { status: 404 });
  const close = viewer && (viewer.role === "ADMIN" || viewer.id === p.userId || viewer.id === p.guardianId);
  const verifiedRecruiter = viewer?.role === "RECRUITER" && viewer.recruiter?.verification === "VERIFIED";
  if (!close && !verifiedRecruiter) return new Response("Réservé aux recruteurs vérifiés", { status: 403 });
  const data = await readStored(p.cvKey);
  if (!data) return new Response("Introuvable", { status: 404 });
  const ext = p.cvKey.split(".").pop() ?? "pdf";
  const name = `CV-${p.firstName}-${p.lastName}.${ext}`.normalize("NFD").replace(/[^\w.-]/g, "");
  return new Response(new Uint8Array(data), {
    headers: {
      "Content-Type": MEDIA_CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="${name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
