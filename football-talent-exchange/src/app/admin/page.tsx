import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { RECRUITER_TYPE_LABELS } from "@/lib/domain/reference";
import { formatUsd } from "@/lib/domain/pricing";
import { Badge, Flash, Stat } from "@/components/ui";
import { resolveReportAction, setSuspendedAction, setVerificationAction, verifyStatAction } from "@/app/actions/admin";

export const metadata = { title: "Administration" };

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser(["ADMIN"]);
  const sp = await searchParams;
  const now = new Date();
  const d30 = new Date(Date.now() - 30 * 86400000);
  const [players, recruiters, guardians, newUsers, activeSubs, canceled30, pending, reports, flagged, stats, search] = await Promise.all([
    db.user.count({ where: { role: "PLAYER" } }),
    db.user.count({ where: { role: "RECRUITER" } }),
    db.user.count({ where: { role: "GUARDIAN" } }),
    db.user.count({ where: { createdAt: { gte: d30 } } }),
    db.subscription.findMany({ where: { plan: { not: "FREE" }, status: { in: ["ACTIVE", "PAST_DUE"] }, currentPeriodEnd: { gt: now } } }),
    db.subscription.count({ where: { status: "CANCELED", updatedAt: { gte: d30 } } }),
    db.recruiterProfile.findMany({ where: { verification: "PENDING" }, include: { user: true }, orderBy: { createdAt: "asc" }, take: 50 }),
    db.report.findMany({ where: { status: "OPEN" }, include: { reporter: true, reported: true }, orderBy: { createdAt: "asc" }, take: 50 }),
    db.message.findMany({ where: { scamFlags: { isEmpty: false }, createdAt: { gte: d30 } }, include: { sender: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    db.seasonStat.findMany({ where: { verified: false }, include: { player: true }, orderBy: { id: "desc" }, take: 20 }),
    sp.q ? db.user.findMany({ where: { OR: [{ email: { contains: sp.q, mode: "insensitive" } }, { name: { contains: sp.q, mode: "insensitive" } }] }, take: 20 }) : Promise.resolve([]),
  ]);
  const mrr = activeSubs.reduce((a, s) => a + (s.interval === "YEAR" ? s.amountCents / 12 : s.amountCents), 0);
  const trialing = await db.subscription.count({ where: { status: "TRIALING", currentPeriodEnd: { gt: now } } });

  return (
    <div className="space-y-8">
      <h1 className="h1">Administration</h1>
      <Flash sp={sp} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Stat label="Joueurs" value={players} />
        <Stat label="Recruteurs" value={recruiters} />
        <Stat label="Parents" value={guardians} />
        <Stat label="Inscrits 30 j" value={newUsers} />
        <Stat label="Abonnés payants" value={activeSubs.length} />
        <Stat label="Essais en cours" value={trialing} />
        <Stat label="Revenu mensuel" value={formatUsd(mrr)} />
        <Stat label="Résiliations 30 j" value={canceled30} />
      </div>

      <section className="card">
        <h2 className="h2 mb-3">Recruteurs à vérifier ({pending.length})</h2>
        {pending.length === 0 ? <p className="muted">Rien à traiter 🎉</p> : (
          <ul className="divide-y divide-gray-100">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p><b>{r.user.name}</b> · {RECRUITER_TYPE_LABELS[r.type]} · {r.organization}</p>
                  <p className="muted">{r.user.email} · {r.website ?? "pas de site"} {r.fifaLicense && `· licence FIFA ${r.fifaLicense}`}</p>
                </div>
                <div className="flex gap-2">
                  {(["VERIFIED", "REJECTED"] as const).map((s) => (
                    <form key={s} action={setVerificationAction}>
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} />
                      <button className={s === "VERIFIED" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{s === "VERIFIED" ? "Valider" : "Refuser"}</button>
                    </form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Signalements ouverts ({reports.length})</h2>
        {reports.length === 0 ? <p className="muted">Aucun signalement.</p> : (
          <ul className="divide-y divide-gray-100">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p><Badge tone="red">{r.reason}</Badge> <b>{r.reported.name}</b> ({r.reported.email}) signalé par {r.reporter.name}</p>
                  <p className="muted">{r.details}</p>
                </div>
                <div className="flex gap-2">
                  {[["SUSPEND", "Suspendre", "btn-danger btn-sm"], ["RESOLVE", "Traité", "btn-secondary btn-sm"], ["DISMISS", "Ignorer", "btn-secondary btn-sm"]].map(([a, l, c]) => (
                    <form key={a} action={resolveReportAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value={a} /><button className={c}>{l}</button></form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Messages suspects détectés (30 j)</h2>
        {flagged.length === 0 ? <p className="muted">Aucun.</p> : (
          <ul className="space-y-2 text-sm">
            {flagged.map((m) => (
              <li key={m.id} className="rounded-xl bg-red-50 p-3">
                <p><b>{m.sender.name}</b> ({m.sender.email}) · {m.scamFlags.join(", ")}</p>
                <p className="mt-1 line-clamp-2 text-gray-700">{m.body}</p>
                <form action={setSuspendedAction} className="mt-2"><input type="hidden" name="userId" value={m.senderId} /><input type="hidden" name="suspended" value="1" /><button className="btn-danger btn-sm">Suspendre l&apos;expéditeur</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Statistiques à vérifier</h2>
        <p className="muted mb-3">Valide une saison après réception d&apos;une attestation du club.</p>
        <ul className="divide-y divide-gray-100 text-sm">
          {stats.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <span><Link className="link" href={`/joueurs/${s.player.slug}`}>{s.player.firstName} {s.player.lastName}</Link> · {s.season} · {s.club} · {s.matches} MJ, {s.goals} buts</span>
              <form action={verifyStatAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="verified" value="1" /><button className="btn-secondary btn-sm">Marquer vérifiée</button></form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="h2 mb-3">Rechercher un compte</h2>
        <form className="flex gap-2" method="get"><input name="q" defaultValue={sp.q} className="input" placeholder="Nom ou courriel" /><button className="btn-secondary">Chercher</button></form>
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {search.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2">
              <span>{u.name} · {u.email} · {u.role} {u.suspended && <Badge tone="red">Suspendu</Badge>}</span>
              <form action={setSuspendedAction}><input type="hidden" name="userId" value={u.id} /><input type="hidden" name="suspended" value={u.suspended ? "0" : "1"} /><button className="btn-secondary btn-sm">{u.suspended ? "Réactiver" : "Suspendre"}</button></form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
