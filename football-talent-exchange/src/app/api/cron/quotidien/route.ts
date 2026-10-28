import { cronAuthorized } from "@/lib/cron";
import { GET as abonnements } from "../abonnements/route";
import { GET as alertes } from "../alertes/route";
import { GET as actualites } from "../actualites/route";

export const runtime = "nodejs";
export const maxDuration = 60;

// Une seule tâche quotidienne (compatible avec l'offre gratuite de Vercel) qui lance les trois autres :
// abonnements et commissions, alertes des recruteurs, veille d'actualités.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return new Response("Non autorisé", { status: 401 });
  const results: Record<string, unknown> = {};
  for (const [name, run] of [["abonnements", abonnements], ["alertes", alertes], ["actualites", actualites]] as const) {
    try {
      results[name] = await (await run(req)).json();
    } catch (e) {
      results[name] = { error: (e as Error).message };
    }
  }
  return Response.json(results);
}
