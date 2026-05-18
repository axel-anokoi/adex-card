"use client";

import CategoriesSection from "@/components/categories/categorie-section";
import Link from "next/link";

// ─────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────

const features = [
  { icon: "⚡", title: "Livraison < 2 min",  desc: "Code livré instantanément par email après paiement" },
  { icon: "🔐", title: "Paiement sécurisé",  desc: "Wave, Orange Money & Mobile Money acceptés" },
  { icon: "✅", title: "100% Officiel",       desc: "Codes authentiques garantis, jamais utilisés" },
  { icon: "💬", title: "Support 24/7",        desc: "Assistance rapide sur WhatsApp" },
];

const steps = [
  { num: "01", icon: "🛒", title: "Choisissez votre carte",  desc: "Parcourez le catalogue et sélectionnez la carte et le montant souhaités." },
  { num: "02", icon: "💳", title: "Payez en sécurité",       desc: "Réglez avec Wave, Orange Money ou Moov Money. 100% sécurisé et instantané." },
  { num: "03", icon: "📧", title: "Recevez votre code",      desc: "Votre code est livré par email en moins de 2 minutes. Prêt à l'emploi !" },
];

// ─────────────────────────────────────────
//  HERO
// ─────────────────────────────────────────

function HeroSection() {
  return (
    <section style={{
      background: "var(--bg2)",
      borderBottom: "1px solid var(--border)",
      padding: "2.5rem 1.25rem",
    }}>
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: "1.25rem",
      }}>
        {/* Stock badge */}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "var(--cyan-dim)", border: "1px solid var(--border-cyan)",
          color: "var(--cyan)", padding: "4px 14px", borderRadius: 999,
          fontSize: 12, fontWeight: 600,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--cyan)", display: "inline-block" }} />
          En stock · Livraison instantanée
        </span>

        {/* Heading */}
        <h1 style={{
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
          fontWeight: 800,
          lineHeight: 1.15,
          color: "var(--text)",
          letterSpacing: "-0.5px",
          margin: 0,
        }}>
          Toutes Vos Cartes<br />
          <span style={{ color: "var(--cyan)" }}>Côte d&apos;Ivoire</span>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 480, margin: 0 }}>
          PSN, Xbox, Nintendo, Apple — payez avec Wave, Orange Money ou Moov Money.
          Code livré en moins de 2 minutes.
        </p>

        {/* CTAs */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/shop" className="btn-primary">
            Acheter maintenant
            <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <Link href="/shop" className="btn-outline">Voir le catalogue</Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
//  SECTIONS
// ─────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="section-container">
      <div className="grid-4-2-1">
        {features.map((f) => (
          <article key={f.title} className="feat-card">
            <div style={{ fontSize: 20, marginBottom: 10 }}>{f.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</div>
          </article>
        ))}
      </div>

      <style>{`
        .section-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2rem 1.25rem;
        }
        .grid-4-2-1 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        @media (min-width: 768px) {
          .grid-4-2-1 { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 479px) {
          .grid-4-2-1 { grid-template-columns: 1fr; }
        }
        .grid-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 768px) {
          .grid-steps { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </section>
  );
}

function StepsSection() {
  return (
    <section className="section-container" style={{ paddingBottom: "3rem" }}>
      <p className="section-label">Processus</p>
      <h2 className="section-title" style={{ marginBottom: "1.25rem" }}>Comment ça marche</h2>
      <div className="grid-steps">
        {steps.map((s) => (
          <article key={s.num} className="step-card">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--cyan)", marginBottom: 12 }}>{s.num}</p>
            <div style={{ fontSize: 24, marginBottom: 12 }}>{s.icon}</div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 6 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.65 }}>{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────

export default function HomePage() {
  return (
    <main style={{ background: "var(--bg)" }}>
      <HeroSection />
      <CategoriesSection />
      <FeaturesSection />
      <StepsSection />
    </main>
  );
}
