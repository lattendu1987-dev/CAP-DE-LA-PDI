"use server";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/i18n/config";
import { LOCALE_COOKIE } from "@/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function setLocaleAction(fd: FormData) {
  const locale = fd.get("locale");
  if (isLocale(locale)) {
    (await cookies()).set(LOCALE_COOKIE, locale, { path: "/", maxAge: 365 * 86400, sameSite: "lax" });
    const user = await getCurrentUser();
    if (user) await db.user.update({ where: { id: user.id }, data: { locale } });
  }
  // Retour sur la page d'origine (même site uniquement).
  const ref = (await headers()).get("referer");
  let back = "/";
  try {
    if (ref) {
      const u = new URL(ref);
      back = u.pathname + u.search;
    }
  } catch {}
  redirect(back.startsWith("/") && !back.startsWith("//") ? back : "/");
}
