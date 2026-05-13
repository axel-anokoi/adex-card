import type { Metadata } from "next";
import { Orbitron, Barlow } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { GamingBackground } from "@/components/layout/gaming-background";

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
  title: "BabiCard CI | Cartes Cadeaux Gaming Côte d'Ivoire",
  description:
    "Achetez vos cartes PSN, Xbox, iTunes, Google Play. Paiement Djamo & Moov Money. Livraison instantanée en Côte d'Ivoire.",
  keywords: ["cartes cadeau", "gaming", "PSN", "Xbox", "Côte d'Ivoire", "Djamo", "Moov Money"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${orbitron.variable} ${barlow.variable} h-full antialiased dark`}
    >
      <body className="relative min-h-full flex flex-col overflow-x-hidden" style={{ background: "#000005", color: "#f0f0ff" }}>
        {/* Particle canvas + custom cursor — mounts client-side only */}
        <GamingBackground />

        {/* All page content sits above the canvas (z-index via relative) */}
        <div className="relative z-10 flex min-h-full flex-col">
          <Header />
          <main className="flex-1 pt-16">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}