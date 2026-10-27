import { FormAutosave } from "@/components/form-autosave";
import { autosaveText } from "@/lib/ui-text";
import { requireUser } from "@/lib/auth";
import { getLocale, getMessages } from "@/i18n/server";
import { isSubscriptionActive } from "@/lib/domain/rules";
import { POSITION_CODES } from "@/lib/domain/reference";
import { Empty, Field, Flash } from "@/components/ui";
import { CountrySelect } from "@/components/country-select";
import { SubmitButton } from "@/components/submit-button";
import { createTrialAction } from "@/app/actions/trials";

export async function generateMetadata() {
  return { title: (await getMessages()).trials.newTitle };
}

export default async function NewTrialPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser(["RECRUITER"]);
  const [sp, m, locale] = await Promise.all([searchParams, getMessages(), getLocale()]);
  const t = m.trials;
  const f = t.fields;
  if (user.recruiter?.verification !== "VERIFIED" || !isSubscriptionActive(user.subscription)) return <Empty>{t.newOnlyVerified}</Empty>;
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="h1 mb-6">{t.newTitle}</h1>
      <Flash sp={sp} />
      <form action={createTrialAction} className="card grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><FormAutosave id="new-trial" text={autosaveText(m)} /></div>
        <div className="sm:col-span-2"><Field label={f.title}><input className="input" name="title" required minLength={5} maxLength={120} /></Field></div>
        <div className="sm:col-span-2"><Field label={f.description}><textarea className="input min-h-32" name="description" required minLength={20} maxLength={3000} /></Field></div>
        <div className="sm:col-span-2"><Field label={f.address} hint={f.addressHint}><input className="input" name="address" maxLength={160} autoComplete="street-address" /></Field></div>
        <Field label={f.city}><input className="input" name="city" required /></Field>
        <Field label={f.country}><CountrySelect name="country" locale={locale} defaultValue={user.country} /></Field>
        <Field label={f.startsAt}><input className="input" type="datetime-local" name="startsAt" required /></Field>
        <Field label={f.deadline}><input className="input" type="datetime-local" name="deadline" required /></Field>
        <Field label={f.minAge}><input className="input" type="number" name="minAge" min={10} max={45} /></Field>
        <Field label={f.maxAge}><input className="input" type="number" name="maxAge" min={10} max={45} /></Field>
        <div className="sm:col-span-2"><Field label={f.conditions}><textarea className="input min-h-20" name="conditions" maxLength={1000} /></Field></div>
        <fieldset className="sm:col-span-2">
          <legend className="label">{f.positions}</legend>
          <div className="flex flex-wrap gap-2">
            {POSITION_CODES.map((c) => (
              <label key={c} className="flex items-center gap-1 rounded-lg border border-gray-200 px-2 py-1 text-xs"><input type="checkbox" name="positions" value={c} /> {m.labels.positions[c]}</label>
            ))}
          </div>
        </fieldset>
        <label className="flex items-start gap-2 text-sm sm:col-span-2"><input type="checkbox" name="free" required className="mt-1" /> {t.freeRule}</label>
        <div className="sm:col-span-2"><SubmitButton pendingLabel={m.common.wait}>{t.publish}</SubmitButton></div>
      </form>
    </div>
  );
}
