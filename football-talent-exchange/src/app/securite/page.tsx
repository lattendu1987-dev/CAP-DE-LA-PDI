import { getMessages } from "@/i18n/server";

export async function generateMetadata() {
  return { title: (await getMessages()).safety.metaTitle };
}

export default async function SafetyPage() {
  const t = (await getMessages()).safety;
  return (
    <article className="mx-auto max-w-2xl space-y-5 text-gray-800">
      <h1 className="h1">{t.title}</h1>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
        <h2 className="h2 text-red-800">{t.goldenTitle}</h2>
        <p className="mt-2 text-red-900">{t.golden}</p>
      </div>
      <h2 className="h2">{t.platformTitle}</h2>
      <ul className="list-disc space-y-2 ps-5">{t.platform.map((s) => <li key={s}>{s}</li>)}</ul>
      <h2 className="h2">{t.minorsTitle}</h2>
      <p>{t.minors}</p>
      <h2 className="h2">{t.agentsTitle}</h2>
      <p>{t.agents}</p>
    </article>
  );
}
