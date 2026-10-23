import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ageOn } from "@/lib/domain/age";
import { positionLabel } from "@/lib/domain/reference";
import { Badge, Empty, Flash } from "@/components/ui";
import { giveConsentAction, withdrawConsentAction } from "@/app/actions/guardian";

export const metadata = { title: "Espace parent / tuteur" };

export default async function GuardianPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["GUARDIAN"]);
  const sp = await searchParams;
  const players = await db.playerProfile.findMany({ where: { guardianId: user.id }, include: { _count: { select: { views: true } } } });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">Espace parent / tuteur</h1>
        <p className="muted mt-1">Tu reçois une copie de chaque message adressé à ton enfant. Seuls les recruteurs vérifiés peuvent le contacter.</p>
      </div>
      <Flash sp={sp} />
      {players.length === 0 ? (
        <Empty>Aucun joueur n&apos;est rattaché à ton courriel ({user.email}). Le joueur doit indiquer exactement ce courriel lors de son inscription.</Empty>
      ) : (
        players.map((p) => (
          <div key={p.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold">{p.firstName} {p.lastName}</p>
                <p className="muted">{ageOn(p.birthDate)} ans · {positionLabel(p.mainPosition)} · {p._count.views} vue(s) du profil</p>
              </div>
              {p.guardianConsentAt ? <Badge tone="green">Consentement donné</Badge> : <Badge tone="gold">En attente de ton accord</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary btn-sm" href={`/joueurs/${p.slug}`}>Voir le profil</Link>
              {p.guardianConsentAt ? (
                <form action={withdrawConsentAction}><input type="hidden" name="playerId" value={p.id} /><button className="btn-danger btn-sm">Retirer mon consentement</button></form>
              ) : (
                <form action={giveConsentAction}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <label className="mb-2 flex items-start gap-2 text-sm">
                    <input type="checkbox" required className="mt-1" />
                    <span>Je suis le parent ou le tuteur légal de {p.firstName} et j&apos;autorise la publication de son profil sportif. Je peux retirer cet accord à tout moment.</span>
                  </label>
                  <button className="btn-primary btn-sm">Je donne mon accord</button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
      <Link href="/messages" className="btn-secondary">Voir les messages</Link>
    </div>
  );
}
