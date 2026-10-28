import { getMessages } from "@/i18n/server";
import { LegalPage } from "@/components/legal";

export async function generateMetadata() {
  return { title: (await getMessages()).legal.privacyTitle };
}

export default async function PrivacyPage() {
  const t = (await getMessages()).legal;
  return <LegalPage title={t.privacyTitle} draft={t.privacyDraft} sections={t.privacy} />;
}
