import { getMessages } from "@/i18n/server";
import { LegalPage } from "@/components/legal";

export async function generateMetadata() {
  return { title: (await getMessages()).legal.termsTitle };
}

export default async function TermsPage() {
  const t = (await getMessages()).legal;
  return <LegalPage title={t.termsTitle} draft={t.draft} sections={t.terms} />;
}
