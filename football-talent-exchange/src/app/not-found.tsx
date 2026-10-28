import Link from "next/link";
import { getMessages } from "@/i18n/server";

export default async function NotFound() {
  const m = await getMessages();
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="text-5xl">🥅</p>
      <h1 className="h1 mt-4">{m.notFound.title}</h1>
      <p className="muted mt-2">{m.notFound.text}</p>
      <Link href="/" className="btn-primary mt-6">{m.notFound.home}</Link>
    </div>
  );
}
