import type { Metadata } from "next";
import { Orbitron, Barlow } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const orbitron = Orbitron({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow({
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BabiCard CI | Cartes Cadeaux Gaming Côte d'Ivoire",
  description: "Acheté vos cartes PSN, Xbox, iTunes, Google Play. Paiement Djamo & Moov Money. Livraison instantanée en Côte d'Ivoire.",
  themeColor: "#0A0A0F",
  keywords: ["cartes cadeau", "gaming", "PSN", "Xbox", "Côte d'Ivoire", "Djamo", "Moov Money"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html
      lang="fr"
      className={`${orbitron.variable} ${barlow.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0A0F] text-white">
        <Header />
        <main className="flex-1 pt-16 page-transition-enter">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
