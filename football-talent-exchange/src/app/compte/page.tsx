import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { formatDate } from "@/i18n/format";
import { Badge, Field, Flash } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PushBanner } from "@/components/push-banner";
import { changePasswordAction, deleteAccountAction } from "@/app/actions/account";
import { updateRecruiterAction } from "@/app/actions/recruiter";

export async function generateMetadata() {
  return { title: (await getMessages()).account.metaTitle };
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.account;
  const r = user.recruiter;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="h1">{t.metaTitle}</h1>
      <Flash sp={sp} />
      <div className="card flex flex-wrap items-center justify-between gap-3 text-sm">
        <div>
          <p><b>{user.name}</b> · {user.email}</p>
          <p className="muted">{t.memberSince(formatDate(user.createdAt, locale))}</p>
        </div>
        <div><p className="label">{t.language}</p><LanguageSwitcher /></div>
      </div>

      <div className="card empty:hidden"><PushBanner m={m} compact={false} /></div>

      {r && (
        <form action={updateRecruiterAction} className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="h2">{t.org}</h2>
            {r.verification === "VERIFIED" ? <Badge tone="blue">{m.labels.verifiedShort}</Badge> : r.verification === "REJECTED" ? <Badge tone="red">{t.rejected}</Badge> : <Badge tone="gold">{t.pending}</Badge>}
          </div>
          <p className="muted">{m.labels.recruiterTypes[r.type]}</p>
          <Field label={m.auth.organization}><input className="input" name="organization" defaultValue={r.organization} required /></Field>
          <Field label={m.auth.website}><input className="input" name="website" defaultValue={r.website ?? ""} dir="ltr" /></Field>
          <Field label={m.auth.fifaLicense}><input className="input" name="fifaLicense" defaultValue={r.fifaLicense ?? ""} /></Field>
          <SubmitButton pendingLabel={m.common.wait}>{m.common.save}</SubmitButton>
        </form>
      )}

      <form action={changePasswordAction} className="card space-y-3">
        <h2 className="h2">{t.password}</h2>
        <Field label={t.current}><input className="input" type="password" name="current" required autoComplete="current-password" /></Field>
        <Field label={t.newPassword}><input className="input" type="password" name="next" required minLength={8} autoComplete="new-password" /></Field>
        <SubmitButton className="btn-secondary" pendingLabel={m.common.wait}>{t.change}</SubmitButton>
      </form>

      <div className="card space-y-3">
        <h2 className="h2">{t.data}</h2>
        <p className="muted">{t.dataText}</p>
        <a className="btn-secondary" href="/api/compte/export">{t.download}</a>
      </div>

      <form action={deleteAccountAction} className="card space-y-3 border-red-200">
        <h2 className="h2 text-red-700">{t.deleteTitle}</h2>
        <p className="muted">{t.deleteText}</p>
        <Field label={t.deleteConfirm}><input className="input" name="confirm" required /></Field>
        <button className="btn-danger">{t.deleteButton}</button>
      </form>
    </div>
  );
}
