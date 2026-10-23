import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate, formatUsd } from "@/i18n/format";
import { Badge, Flash, Stat } from "@/components/ui";
import { resolveReportAction, setPayoutAction, setSuspendedAction, setVerificationAction, verifyStatAction } from "@/app/actions/admin";

export async function generateMetadata() {
  return { title: (await getMessages()).admin.metaTitle };
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser(["ADMIN"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.admin;
  const now = new Date();
  const d30 = new Date(Date.now() - 30 * 86400000);
  const [players, recruiters, guardians, newUsers, activeSubs, canceled30, pending, reports, flagged, stats, payouts, payments, owed, search] = await Promise.all([
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
    db.payout.findMany({ where: { status: "REQUESTED" }, include: { user: true }, orderBy: { createdAt: "asc" } }),
    db.payment.findMany({ where: { status: "SUCCEEDED" }, include: { user: true }, orderBy: { paidAt: "desc" }, take: 15 }),
    db.commission.aggregate({ where: { status: { in: ["PENDING", "AVAILABLE"] } }, _sum: { amountCents: true } }),
    sp.q ? db.user.findMany({ where: { OR: [{ email: { contains: sp.q, mode: "insensitive" } }, { name: { contains: sp.q, mode: "insensitive" } }] }, take: 20 }) : Promise.resolve([]),
  ]);
  const mrr = activeSubs.reduce((a, s) => a + (s.interval === "YEAR" ? s.amountCents / 12 : s.amountCents), 0);
  const trialing = await db.subscription.count({ where: { status: "TRIALING", currentPeriodEnd: { gt: now } } });

  return (
    <div className="space-y-8">
      <h1 className="h1">{t.metaTitle}</h1>
      <Flash sp={sp} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-9">
        <Stat label={t.stats.players} value={players} />
        <Stat label={t.stats.recruiters} value={recruiters} />
        <Stat label={t.stats.guardians} value={guardians} />
        <Stat label={t.stats.new30} value={newUsers} />
        <Stat label={t.stats.paying} value={activeSubs.length} />
        <Stat label={t.stats.trials} value={trialing} />
        <Stat label={t.stats.mrr} value={formatUsd(Math.round(mrr), locale)} />
        <Stat label={t.stats.churn} value={canceled30} />
        <Stat label={t.stats.commissions} value={formatUsd(owed._sum.amountCents ?? 0, locale)} />
      </div>

      <section className="card">
        <h2 className="h2 mb-3">{t.toVerify(pending.length)}</h2>
        {pending.length === 0 ? <p className="muted">{t.nothing}</p> : (
          <ul className="divide-y divide-gray-100">
            {pending.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p><b>{r.user.name}</b> · {m.labels.recruiterTypes[r.type]} · {r.organization}</p>
                  <p className="muted">{r.user.email} · {r.website ?? t.noWebsite} {r.fifaLicense && `· ${t.license(r.fifaLicense)}`}</p>
                </div>
                <div className="flex gap-2">
                  {(["VERIFIED", "REJECTED"] as const).map((s) => (
                    <form key={s} action={setVerificationAction}>
                      <input type="hidden" name="id" value={r.id} /><input type="hidden" name="status" value={s} />
                      <button className={s === "VERIFIED" ? "btn-primary btn-sm" : "btn-secondary btn-sm"}>{s === "VERIFIED" ? t.approve : t.reject}</button>
                    </form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.reports(reports.length)}</h2>
        {reports.length === 0 ? <p className="muted">{t.noReports}</p> : (
          <ul className="divide-y divide-gray-100">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p><Badge tone="red">{r.reason}</Badge> <b>{r.reported.name}</b> ({r.reported.email}) {t.reportedBy(r.reporter.name)}</p>
                  <p className="muted">{r.details}</p>
                </div>
                <div className="flex gap-2">
                  {([["SUSPEND", t.suspend, "btn-danger btn-sm"], ["RESOLVE", t.resolved, "btn-secondary btn-sm"], ["DISMISS", t.dismiss, "btn-secondary btn-sm"]] as const).map(([a, l, c]) => (
                    <form key={a} action={resolveReportAction}><input type="hidden" name="id" value={r.id} /><input type="hidden" name="action" value={a} /><button className={c}>{l}</button></form>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.payouts(payouts.length)}</h2>
        {payouts.length === 0 ? <p className="muted">{t.none}</p> : (
          <ul className="divide-y divide-gray-100 text-sm">
            {payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                <span><b>{formatUsd(p.amountCents, locale)}</b> · {p.user.name} ({p.user.email}) · {m.referral.methods[p.method as keyof typeof m.referral.methods] ?? p.method} : <span dir="ltr">{p.destination}</span></span>
                <div className="flex gap-2">
                  <form action={setPayoutAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="PAID" /><button className="btn-primary btn-sm">{t.markPaid}</button></form>
                  <form action={setPayoutAction}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="status" value="REJECTED" /><button className="btn-secondary btn-sm">{t.reject}</button></form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.payments}</h2>
        {payments.length === 0 ? <p className="muted">{t.none}</p> : (
          <ul className="divide-y divide-gray-100 text-sm">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{p.paidAt ? formatDate(p.paidAt, locale) : ""} · {p.user.name} · {m.billing.plans[p.plan as keyof typeof m.billing.plans]?.name ?? p.plan}</span>
                <span><Badge>{p.provider}</Badge> {formatUsd(p.usdCents, locale)}{p.currency !== "USD" && p.amountMinor > 0 ? ` (${p.amountMinor} ${p.currency})` : ""}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.flagged}</h2>
        {flagged.length === 0 ? <p className="muted">{t.none}</p> : (
          <ul className="space-y-2 text-sm">
            {flagged.map((msg) => (
              <li key={msg.id} className="rounded-xl bg-red-50 p-3">
                <p><b>{msg.sender.name}</b> ({msg.sender.email}) · {msg.scamFlags.join(", ")}</p>
                <p className="mt-1 line-clamp-2 text-gray-700" dir="auto">{msg.body}</p>
                <form action={setSuspendedAction} className="mt-2"><input type="hidden" name="userId" value={msg.senderId} /><input type="hidden" name="suspended" value="1" /><button className="btn-danger btn-sm">{t.suspendSender}</button></form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.statsToVerify}</h2>
        <p className="muted mb-3">{t.statsHint}</p>
        <ul className="divide-y divide-gray-100 text-sm">
          {stats.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2">
              <span><Link className="link" href={`/joueurs/${s.player.slug}`}>{s.player.firstName} {s.player.lastName}</Link> · {s.season} · {s.club} · {s.matches} / {s.goals}</span>
              <form action={verifyStatAction}><input type="hidden" name="id" value={s.id} /><input type="hidden" name="verified" value="1" /><button className="btn-secondary btn-sm">{t.markVerified}</button></form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="h2 mb-3">{t.findAccount}</h2>
        <form className="flex gap-2" method="get"><input name="q" defaultValue={sp.q} className="input" placeholder={t.findPlaceholder} /><button className="btn-secondary">{t.find}</button></form>
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {search.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 py-2">
              <span>{u.name} · {u.email} · {m.labels.roles[u.role]} {u.suspended && <Badge tone="red">{t.suspended}</Badge>}</span>
              <form action={setSuspendedAction}><input type="hidden" name="userId" value={u.id} /><input type="hidden" name="suspended" value={u.suspended ? "0" : "1"} /><button className="btn-secondary btn-sm">{u.suspended ? t.reactivate : t.suspend}</button></form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
