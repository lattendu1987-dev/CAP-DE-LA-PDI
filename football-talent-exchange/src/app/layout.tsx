import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { archivo, instrumentSerif, notoKufi } from "./fonts";
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

export const viewport: Viewport = { themeColor: "#040907", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, m] = await Promise.all([getLocale(), getMessages()]);
  return (
    <html lang={locale} dir={RTL.includes(locale) ? "rtl" : "ltr"} className={`${archivo.variable} ${instrumentSerif.variable} ${notoKufi.variable}`}>
      <head>
        {/* Avant le premier affichage : décide si l'introduction de l'accueil doit jouer (1re visite de la
            session, sans « réduire les animations »), pour éviter tout flash de contenu. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(location.pathname==='/'){var d=document.documentElement;d.classList.add('lx-js');if(!sessionStorage.getItem('lx-intro')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){d.setAttribute('data-lx-intro','on');sessionStorage.setItem('lx-intro','1')}setTimeout(function(){var r=document.querySelector('[data-lx]');if(r&&!r.__lx){d.classList.remove('lx-js');d.removeAttribute('data-lx-intro')}},4000)}}catch(e){}",
          }}
        />
      </head>
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
