import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource-variable/noto-kufi-arabic/index.css";
import "./globals.css";
import { Nav } from "@/components/nav";
import { InstallPrompt } from "@/components/install-prompt";
import { getLocale, getMessages } from "@/i18n/server";
import { RTL } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const m = await getMessages();
  return {
    title: { default: m.meta.title, template: `%s · ${m.meta.title}` },
    description: m.meta.description,
    applicationName: m.meta.title,
    appleWebApp: { capable: true, title: "TalentExchange", statusBarStyle: "default" },
    icons: { icon: "/icon-192.png", apple: "/apple-icon.png" },
  };
}

export const viewport: Viewport = { themeColor: "#15803d", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, m] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} dir={RTL.includes(locale) ? "rtl" : "ltr"}>
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <footer className="site-footer no-print border-t">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-8 text-sm">
            <span>© {new Date().getFullYear()} {m.meta.title}</span>
            <Link href="/detections">{m.nav.trials}</Link>
            <Link href="/tarifs">{m.footer.pricing}</Link>
            <Link href="/securite">{m.footer.safety}</Link>
            <Link href="/legal/cgu">{m.footer.terms}</Link>
            <Link href="/legal/confidentialite">{m.footer.privacy}</Link>
          </div>
        </footer>
        <InstallPrompt text={m.install} />
      </body>
    </html>
  );
}
