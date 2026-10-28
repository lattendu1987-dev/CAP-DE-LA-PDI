export function LegalPage({ title, draft, sections }: { title: string; draft: string; sections: [string, string][] }) {
  return (
    <article className="mx-auto max-w-2xl space-y-4 text-sm leading-relaxed text-gray-800">
      <h1 className="h1">{title}</h1>
      <p className="rounded-xl bg-amber-50 p-3 text-amber-900">{draft}</p>
      {sections.map(([h, p]) => (
        <section key={h}>
          <h2 className="h2">{h}</h2>
          <p className="mt-1">{p}</p>
        </section>
      ))}
    </article>
  );
}
