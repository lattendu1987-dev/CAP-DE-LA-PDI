import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Nav } from "@/components/nav";
import Link from "next/link";

export const metadata: Metadata = {
  title: { default: "Football Talent Exchange", template: "%s · Football Talent Exchange" },
  description: "La vitrine internationale des footballeurs. Les recruteurs trouvent, regardent et contactent directement les talents.",
};

export const viewport: Viewport = { themeColor: "#15803d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen font-sans antialiased">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">{children}</main>
        <footer className="no-print border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-gray-500">
            <span>© {new Date().getFullYear()} Football Talent Exchange</span>
            <Link className="hover:text-gray-800" href="/tarifs">Tarifs</Link>
            <Link className="hover:text-gray-800" href="/securite">Sécurité des joueurs</Link>
            <Link className="hover:text-gray-800" href="/legal/cgu">Conditions d&apos;utilisation</Link>
            <Link className="hover:text-gray-800" href="/legal/confidentialite">Confidentialité</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
