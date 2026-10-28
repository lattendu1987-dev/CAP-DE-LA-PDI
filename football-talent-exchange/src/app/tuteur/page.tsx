import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { ageOn } from "@/lib/domain/age";
import { positionLabel } from "@/lib/domain/reference";
import { Badge, Empty, Flash } from "@/components/ui";
import { giveConsentAction, withdrawConsentAction } from "@/app/actions/guardian";

export async function generateMetadata() {
  return { title: (await getMessages()).guardian.metaTitle };
}

export default async function GuardianPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["GUARDIAN"]);
  const [sp, m] = await Promise.all([searchParams, getMessages()]);
  const t = m.guardian;
  const players = await db.playerProfile.findMany({ where: { guardianId: user.id }, include: { _count: { select: { views: true } } } });
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">{t.title}</h1>
        <p className="muted mt-1">{t.intro}</p>
      </div>
      <Flash sp={sp} />
      {players.length === 0 ? (
        <Empty>{t.empty(user.email)}</Empty>
      ) : (
        players.map((p) => (
          <div key={p.id} className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-lg font-bold">{p.firstName} {p.lastName}</p>
                <p className="muted">{m.common.years(ageOn(p.birthDate))} · {positionLabel(m, p.mainPosition)} · {t.views(p._count.views)}</p>
              </div>
              {p.guardianConsentAt ? <Badge tone="green">{t.consentGiven}</Badge> : <Badge tone="gold">{t.consentPending}</Badge>}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link className="btn-secondary btn-sm" href={`/joueurs/${p.slug}`}>{t.viewProfile}</Link>
              {p.guardianConsentAt ? (
                <form action={withdrawConsentAction}><input type="hidden" name="playerId" value={p.id} /><button className="btn-danger btn-sm">{t.withdraw}</button></form>
              ) : (
                <form action={giveConsentAction}>
                  <input type="hidden" name="playerId" value={p.id} />
                  <label className="mb-2 flex items-start gap-2 text-sm">
                    <input type="checkbox" required className="mt-1" />
                    <span>{t.consentText(p.firstName)}</span>
                  </label>
                  <button className="btn-primary btn-sm">{t.give}</button>
                </form>
              )}
            </div>
          </div>
        ))
      )}
      <Link href="/messages" className="btn-secondary">{t.seeMessages}</Link>
    </div>
  );
}
