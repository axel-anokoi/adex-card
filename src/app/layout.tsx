import type { Metadata } from "next";
import { Orbitron, Barlow } from "next/font/google";
import "./globals.css";
import { GamingBackground } from "@/components/layout/gaming-background";

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem("theme");
    var theme = saved === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.classList.remove("dark", "light");
    root.classList.add(theme);
  } catch (e) {}
})();
`;

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "800", "900"],
});

const barlow = Barlow({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AdexCard CI | Toutes Vos Cartes Cadeaux Digitales",
  description:
    "Achetez vos cartes iTunes, Google Play, Steam, Netflix et bien plus. Payez en quelques secondes via Mobile Money pour une Livraison instantanée ",
  keywords: ["cartes cadeau", "gaming", "PSN", "Xbox", "Côte d'Ivoire", "Djamo", "Moov Money"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${orbitron.variable} ${barlow.variable} h-full antialiased light`}
      suppressHydrationWarning
    >
      <body
        className="relative min-h-full flex flex-col overflow-x-hidden"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Particle canvas + custom cursor — mounts client-side only */}
        {/* <GamingBackground /> */}

        {/* All page content sits above the canvas (z-index via relative) */}
        <div className="relative z-10 flex min-h-full flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}