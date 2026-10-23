import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate, formatUsd } from "@/i18n/format";
import { referralBalance, uniqueReferralCode } from "@/lib/referral";
import { MIN_PAYOUT_CENTS, REFERRAL_MONTHS } from "@/lib/domain/referral";
import { isMinor } from "@/lib/domain/age";
import { appUrl } from "@/lib/email";
import { Badge, Field, Flash, Stat } from "@/components/ui";
import { ShareButtons } from "@/components/share";
import { SubmitButton } from "@/components/submit-button";
import { requestPayoutAction } from "@/app/actions/referral";

export async function generateMetadata() {
  return { title: (await getMessages()).referral.metaTitle };
}

export default async function ReferralPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  let user = await requireUser();
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.referral;
  if (!user.referralCode) {
    // Comptes créés avant le parrainage : on génère le code à la première visite.
    user = { ...user, ...(await db.user.update({ where: { id: user.id }, data: { referralCode: await uniqueReferralCode() } })) };
  }
  const link = `${appUrl()}/?ref=${user.referralCode}`;
  const [balance, referrals, commissions, payouts] = await Promise.all([
    referralBalance(user.id),
    db.user.count({ where: { referredById: user.id } }),
    db.commission.findMany({ where: { earnerId: user.id }, include: { source: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.payout.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  const minor = !!user.player && isMinor(user.player.birthDate);
  const history = [
    ...commissions.map((c) => ({ id: c.id, date: c.createdAt, label: t.commissionFrom(c.source?.name ?? "—"), amount: c.amountCents, status: c.status as string })),
    ...payouts.map((p) => ({ id: p.id, date: p.createdAt, label: p.method === "CREDIT" ? t.creditUsed : t.payoutLine(t.methods[p.method as keyof typeof t.methods] ?? p.method), amount: -p.amountCents, status: p.status as string })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="h1">{t.title}</h1>
        <p className="muted mt-1">{t.intro(REFERRAL_MONTHS)}</p>
      </div>
      <Flash sp={sp} />

      <div className="card space-y-3">
        <h2 className="h2">{t.yourLink}</h2>
        <p className="break-all rounded-xl bg-gray-50 p-3 font-mono text-sm" dir="ltr" data-testid="referral-link">{link}</p>
        <p className="muted">{t.yourCode(user.referralCode!)}</p>
        <ShareButtons url={link} text={t.shareText(link)} labels={{ whatsapp: m.common.shareWhatsApp, copy: m.common.copy, copied: m.common.copied }} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t.available} value={formatUsd(balance.available, locale)} />
        <Stat label={t.pending} value={formatUsd(balance.pending, locale)} />
        <Stat label={t.totalEarned} value={formatUsd(balance.totalEarned, locale)} />
        <Stat label={t.referrals} value={referrals} />
      </div>

      <div className="card">
        <h2 className="h2 mb-3">{t.howTitle}</h2>
        <ol className="list-decimal space-y-1.5 ps-5 text-sm text-gray-700">{t.how.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="mt-3 text-xs text-gray-500">{t.rules}</p>
      </div>

      <div className="card">
        <h2 className="h2 mb-3">{t.withdrawTitle}</h2>
        {minor ? <p className="muted">{t.minorNoWithdraw}</p> : (
          <form action={requestPayoutAction} className="grid gap-3 sm:grid-cols-3">
            <Field label={t.method}>
              <select name="method" className="input">{(Object.keys(t.methods) as (keyof typeof t.methods)[]).map((k) => <option key={k} value={k}>{t.methods[k]}</option>)}</select>
            </Field>
            <Field label={t.destination}><input name="destination" className="input" required dir="ltr" /></Field>
            <Field label={t.amount}><input name="amount" type="number" step="0.01" min={MIN_PAYOUT_CENTS / 100} className="input" required /></Field>
            <div className="sm:col-span-3"><SubmitButton pendingLabel={m.common.wait} className="btn-secondary">{t.request}</SubmitButton></div>
          </form>
        )}
      </div>

      <div className="card">
        <h2 className="h2 mb-3">{t.history}</h2>
        {history.length === 0 ? <p className="muted">{t.noHistory}</p> : (
          <ul className="divide-y divide-gray-100 text-sm">
            {history.map((h) => (
              <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>{formatDate(h.date, locale)} · {h.label}</span>
                <span className="flex items-center gap-2">
                  <b className={h.amount >= 0 ? "text-pitch-700" : "text-gray-700"}>{h.amount >= 0 ? "+" : "−"}{formatUsd(Math.abs(h.amount), locale)}</b>
                  <Badge tone={h.status === "AVAILABLE" || h.status === "PAID" ? "green" : h.status === "CANCELED" || h.status === "REJECTED" ? "red" : "gold"}>{t.statuses[h.status as keyof typeof t.statuses]}</Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
