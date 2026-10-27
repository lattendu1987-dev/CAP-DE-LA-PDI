"use server";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMessages } from "@/i18n/server";
import { refreshNews } from "@/lib/news";

/** Administration : lance la veille tout de suite (sans attendre la tâche quotidienne). */
export async function refreshNewsAction() {
  await requireUser(["ADMIN"]);
  const m = await getMessages();
  const r = await refreshNews();
  redirect(`/actualites?ok=${encodeURIComponent(m.news.refreshed(r.added))}`);
}

/** Administration : retire un article (hors sujet, douteux). */
export async function hideNewsAction(fd: FormData) {
  await requireUser(["ADMIN"]);
  await db.newsItem.update({ where: { id: String(fd.get("id")) }, data: { hidden: true } });
  redirect(`/actualites?onglet=${fd.get("onglet") === "NEWS" ? "NEWS" : "OPPORTUNITY"}`);
}
