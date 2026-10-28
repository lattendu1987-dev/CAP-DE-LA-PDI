import { cronAuthorized } from "@/lib/cron";
import { refreshNews } from "@/lib/news";

export const runtime = "nodejs";
export const maxDuration = 60;

// Veille automatique : nouvelles détections, essais et actualités du football (une fois par jour).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Non autorisé", { status: 401 });
  return Response.json(await refreshNews());
}
