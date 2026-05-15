"use client";

import CategoriesSection from "@/components/categories/categorie-section";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// FCFA conversion
const EUR_TO_FCFA = 655;
const toFCFA = (eur: number) => (eur).toLocaleString("fr-FR");

// ─────────────────────────────────────────
//  DATA
// ─────────────────────────────────────────

const platforms = [
  {
    slug: "playstation",
    badge: "🎮 PlayStation",
    icon: "🎮",
    title: "PlayStation Network Cards",
    subtitle: "PSN • Région US",
    amounts: [10, 20, 50],
    cardBg: "linear-gradient(145deg, #000d2e, #002870)",
    cardBorder: "rgba(0,112,204,0.3)",
    glowColor: "rgba(0,112,204,0.5)",
    badgeBg: "rgba(0,112,204,0.2)",
    badgeColor: "rgba(100,180,255,0.9)",
    badgeBorder: "rgba(0,112,204,0.4)",
  },
  {
    slug: "xbox",
    badge: "🎯 Xbox",
    icon: "🎯",
    title: "Xbox Gift Cards",
    subtitle: "Xbox Live • Game Pass",
    amounts: [10, 25, 50],
    cardBg: "linear-gradient(145deg, #001400, #0a3a0a)",
    cardBorder: "rgba(82,176,67,0.3)",
    glowColor: "rgba(82,176,67,0.5)",
    badgeBg: "rgba(82,176,67,0.15)",
    badgeColor: "rgba(130,220,100,0.9)",
    badgeBorder: "rgba(82,176,67,0.4)",
  },
  {
    slug: "nintendo",
    badge: "🍄 Nintendo",
    icon: "🍄",
    title: "Nintendo eShop Cards",
    subtitle: "Switch • NSO",
    amounts: [10, 20, 35],
    cardBg: "linear-gradient(145deg, #200003, #540008)",
    cardBorder: "rgba(228,0,15,0.3)",
    glowColor: "rgba(228,0,15,0.5)",
    badgeBg: "rgba(228,0,15,0.15)",
    badgeColor: "rgba(255,100,100,0.9)",
    badgeBorder: "rgba(228,0,15,0.4)",
  },
  {
    slug: "apple",
    badge: "🍎 Apple",
    icon: "🍎",
    title: "iTunes App Store Cards",
    subtitle: "App Store • iTunes",
    amounts: [5, 10, 25],
    cardBg: "linear-gradient(145deg, #111111, #333333)",
    cardBorder: "rgba(180,180,180,0.25)",
    glowColor: "rgba(180,180,180,0.4)",
    badgeBg: "rgba(180,180,180,0.12)",
    badgeColor: "rgba(210,210,210,0.9)",
    badgeBorder: "rgba(180,180,180,0.35)",
  },
];

const features = [
  { icon: "⚡", title: "Livraison < 2 min",  desc: "Code livré instantanément par email après paiement", accent: "#00ffe0", dim: "rgba(0,255,224,0.1)" },
  { icon: "🔐", title: "Paiement sécurisé",  desc: "Djamo, Moov Money & Wave acceptés",                  accent: "#7b2fff", dim: "rgba(123,47,255,0.1)" },
  { icon: "✅", title: "100% Officiel",       desc: "Codes authentiques garantis, jamais utilisés",       accent: "#00ff88", dim: "rgba(0,255,136,0.1)" },
  { icon: "💬", title: "Support 24/7",        desc: "Assistance rapide sur WhatsApp",                     accent: "#ffb800", dim: "rgba(255,184,0,0.1)" },
];

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", desc: "PSN, PS Plus, PS Stars", cssClass: "gradient-psn  border-psn  glow-psn", count: "12 cartes" },
  { slug: "xbox",        name: "Xbox",        icon: "🎯", desc: "Xbox Live, Game Pass",   cssClass: "gradient-xbox border-xbox glow-xbox", count: "8 cartes" },
  { slug: "nintendo",    name: "Nintendo",    icon: "🍄", desc: "eShop, NSO",              cssClass: "gradient-nintendo border-nintendo glow-nintendo", count: "6 cartes" },
  { slug: "apple",       name: "Apple",       icon: "🍎", desc: "iTunes, App Store",       cssClass: "gradient-apple border-apple glow-apple", count: "5 cartes" },
];

const productsByCategory: Record<string, { id: string; name: string; eur: number; tag: string; image: string }[]> = {
  playstation: [
    { id: "psn-10", name: "Carte PSN US 10FCFA",  eur: 10, tag: "Instantané",  image: "🎮" },
    { id: "psn-20", name: "Carte PSN US 20FCFA",  eur: 20, tag: "Best seller", image: "🎮" },
    { id: "psn-50", name: "Carte PSN US 50FCFA",  eur: 50, tag: "Top up",      image: "🎮" },
  ],
  xbox: [
    { id: "xbox-10", name: "Xbox Gift Card 10FCFA", eur: 10, tag: "Game Pass",  image: "🎯" },
    { id: "xbox-25", name: "Xbox Gift Card 25FCFA", eur: 25, tag: "Populaire",  image: "🎯" },
    { id: "xbox-50", name: "Xbox Gift Card 50FCFA", eur: 50, tag: "Top up",     image: "🎯" },
  ],
  nintendo: [
    { id: "nin-10", name: "Nintendo eShop 10FCFA", eur: 10, tag: "Switch",  image: "🍄" },
    { id: "nin-20", name: "Nintendo eShop 20FCFA", eur: 20, tag: "NSO",     image: "🍄" },
    { id: "nin-35", name: "Nintendo eShop 35FCFA", eur: 35, tag: "Famille", image: "🍄" },
  ],
  apple: [
    { id: "app-5",  name: "iTunes/App Store 5FCFA",  eur: 5,  tag: "Starter",  image: "🍎" },
    { id: "app-10", name: "iTunes/App Store 10FCFA", eur: 10, tag: "Populaire", image: "🍎" },
    { id: "app-25", name: "iTunes/App Store 25FCFA", eur: 25, tag: "Premium",   image: "🍎" },
  ],
};

const steps = [
  { num: "01", icon: "🛒", title: "Choisissez votre carte",  desc: "Parcourez le catalogue et sélectionnez la carte et le montant souhaités." },
  { num: "02", icon: "💳", title: "Payez en sécurité",       desc: "Réglez avec Djamo, Moov Money ou Wave. 100% sécurisé et instantané." },
  { num: "03", icon: "📧", title: "Recevez votre code",      desc: "Votre code est livré par email en moins de 2 minutes. Prêt à l'emploi !" },
];

const testimonials = [
  { name: "Kouamé A.", city: "Abidjan", initials: "K", color: "#2563eb", rating: 5, text: "Incroyable ! J'ai reçu mon code PSN en moins d'une minute. Le paiement Djamo est super pratique. Je recommande à 100% !", product: "PSN 20FCFA" },
  { name: "Fatou D.",  city: "Bouaké",  initials: "F", color: "#7c3aed", rating: 5, text: "Service rapide et fiable. J'ai acheté une carte iTunes pour mon fils, le code a fonctionné immédiatement. Merci AdexCard !", product: "iTunes 10FCFA" },
  { name: "Yves K.",   city: "Abidjan", initials: "Y", color: "#16a34a", rating: 5, text: "Le meilleur site pour acheter des cartes gaming en Côte d'Ivoire. Prix corrects et livraison ultra rapide. Mon go-to !", product: "Xbox 25FCFA" },
];

const stats = [
  { value: "1 200+",  label: "Clients satisfaits" },
  { value: "< 2 min", label: "Délai de livraison" },
  { value: "100%",    label: "Codes authentiques" },
  { value: "24/7",    label: "Support disponible" },
];

// ─────────────────────────────────────────
//  HERO 3D CARD
// ─────────────────────────────────────────

function HeroCard({ platform }: { platform: typeof platforms[0] }) {
  const cardRef  = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const [amtIdx, setAmtIdx] = useState(0);

  function onMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card) return;
    const r  = card.getBoundingClientRect();
    const cx = (r.left + r.right) / 2;
    const cy = (r.top + r.bottom) / 2;
    const dx = (e.clientX - cx) / (r.width / 2);
    const dy = (e.clientY - cy) / (r.height / 2);
    card.style.transform = `perspective(1200px) rotateY(${dx * 18}deg) rotateX(${-dy * 18}deg) scale(1.04)`;
    if (shine) {
      const sx = ((dx + 1) / 2 * 100).toFixed(1);
      const sy = ((dy + 1) / 2 * 100).toFixed(1);
      shine.style.background = `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.18), transparent 60%)`;
    }
  }

  function onMouseLeave() {
    const card  = cardRef.current;
    const shine = shineRef.current;
    if (card)  card.style.transform  = "perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)";
    if (shine) shine.style.background = "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)";
  }

  const amt = platform.amounts[amtIdx];

  return (
    <div
      className="hero-card-wrapper"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: "1200px", pointerEvents: "auto" }}
    >
      <div style={{ position: "relative", width: "80%" }}>
        {/* Rainbow border glow */}
        <div className="card-rainbow-border" />

        {/* Card */}
        <div
          ref={cardRef}
          className="hero-card-inner"
          style={{
            background: platform.cardBg,
            border: `1px solid ${platform.cardBorder}`,
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${platform.glowColor}`,
          }}
        >
          {/* Scanlines */}
          <div className="scanline-overlay" />
          {/* Shine */}
          <div
            ref={shineRef}
            style={{
              position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", borderRadius: 24,
              background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)",
              transition: "background 0.05s",
            }}
          />

          {/* Content */}
          <div style={{ padding: 24, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: platform.badgeBg, border: `1px solid ${platform.badgeBorder}`,
              color: platform.badgeColor,
              padding: "4px 12px", borderRadius: 999,
              fontSize: 11, fontWeight: 600, width: "fit-content", marginBottom: 12,
            }}>
              {platform.badge}
            </div>

            {/* Icon */}
            <div style={{ fontSize: 48, margin: "auto 0", animation: "iconFloat 3s ease-in-out infinite", textShadow: "0 0 30px rgba(0,255,224,0.4)" }}>
              {platform.icon}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{platform.title}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>{platform.subtitle} · Livraison instantanée</div>

              {/* Amount picker */}
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {platform.amounts.map((a, i) => (
                  <button
                    key={a}
                    onClick={() => setAmtIdx(i)}
                    style={{
                      padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      border: amtIdx === i ? "1px solid rgba(0,255,224,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      background: amtIdx === i ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
                      color: amtIdx === i ? "#00ffe0" : "rgba(255,255,255,0.7)",
                      transition: "all 0.2s",
                    }}
                  >
                    {a} FCFA
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 22, fontWeight: 800 }}>
                <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {amt} FCFA
                </span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 8, WebkitTextFillColor: "rgba(255,255,255,0.4)" }}>
                  → {toFCFA(amt)} FCFA
                </span>
              </div>
            </div>
          </div>

          {/* Bottom accent */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#00ffe0,transparent)", opacity: 0.4 }} />
        </div>
      </div>

      <style>{`
        .hero-card-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
        }
.hero-card-wrapper > div {
          width: min(220px, 85vw);
        }
.hero-card-inner {
          width: 100%;
          aspect-ratio: 3 / 4;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
          transform-style: preserve-3d;
          transition: transform 0.08s linear;
        }
        /* Tablet */
        @media (min-width: 640px) and (max-width: 1023px) {
          .hero-card-wrapper > div { width: min(240px, 85vw); }
          .hero-card-inner { aspect-ratio: 2 / 3; }
        }
        /* Large Desktop */
        @media (min-width: 1280px) {
          .hero-card-wrapper > div { width: min(260px, 85vw); }
          .hero-card-inner { aspect-ratio: 3 / 4; }
        }
        @keyframes iconFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          33%      { transform: translateY(-10px) rotate(2deg); }
          66%      { transform: translateY(-5px) rotate(-2deg); }
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────
//  HERO CAROUSEL
// ─────────────────────────────────────────

function HeroCarousel() {
  const [idx, setIdx]           = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = useCallback((next: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setIdx(next); setAnimating(false); }, 280);
  }, [animating]);

  const goNext = useCallback(() => goTo((idx + 1) % platforms.length), [idx, goTo]);
  const goPrev = useCallback(() => goTo((idx - 1 + platforms.length) % platforms.length), [idx, goTo]);

  useEffect(() => {
    const t = setInterval(goNext, 5000);
    return () => clearInterval(t);
  }, [goNext]);

  const p = platforms[idx];

  return (
    <section
      className="hero-section"
      style={{ background: "var(--bg)", position: "relative", overflow: "hidden" }}
    >
      <div className="hero-inner">

        {/* Left text */}
        <div
          className="hero-text"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateX(16px)" : "translateX(0)",
            transition: "opacity 0.28s, transform 0.28s",
          }}
        >
          {/* Live badge */}
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 24 }}>
            <span className="badge-dot" />
            En stock · Livraison instantanée
          </div>

          {/* Heading */}
          <h1
            className="glitch-heading hero-h1"
            data-text="Cartes gaming"
          >
            Cartes gaming<br />
            <span className="text-gradient-cyan">Côte d&apos;Ivoire</span>
          </h1>

          <p className="hero-sub">
            {p.title} — payez avec Djamo ou Moov Money. Code livré en moins de 2 minutes.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <Link href={`/shop?category=${p.slug}`} className="btn-primary animate-cta">
              Acheter maintenant
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/shop" className="btn-outline">Voir le catalogue</Link>
          </div>

          {/* Platform dots + nav arrows */}
          <div className="hero-dots">
            <button
              onClick={goPrev}
              className="dots-nav-btn"
              aria-label="Précédent"
            >←</button>
            {platforms.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Plateforme ${i + 1}`}
                style={{
                  width: i === idx ? 32 : 8, height: 8, borderRadius: 999,
                  background: i === idx ? "var(--cyan)" : "var(--border)",
                  boxShadow: i === idx ? "0 0 12px var(--cyan-glow)" : "none",
                  border: "none", transition: "all 0.3s",
                }}
              />
            ))}
            <button
              onClick={goNext}
              className="dots-nav-btn"
              aria-label="Suivant"
            >→</button>
          </div>
        </div>

        {/* Right 3D card */}
        <div
          className="card-glitch-subtle hero-card-col"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "scale(0.94)" : "scale(1)",
            transition: "opacity 0.28s, transform 0.28s",
            pointerEvents: "none"
          }}
        >
          <HeroCard platform={p} />
        </div>
      </div>

      <style>{`
        /* ── Hero layout ── */
        .hero-section {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 1.25rem;
        }
        .hero-inner {
          max-width: 1100px;
          width: 100%;
          display: grid;
          gap: 2.5rem;
          align-items: center;
          /* Mobile: single column, card below text */
          grid-template-columns: 1fr;
        }
        .hero-text {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hero-h1 {
          font-size: clamp(2rem, 6vw, 3.8rem);
          font-weight: 800;
          line-height: 1.1;
          color: var(--text);
          margin-bottom: 20px;
          letter-spacing: -1px;
          font-family: var(--font-display);
        }
        .hero-sub {
          color: var(--text-muted);
          font-size: 15px;
          line-height: 1.75;
          margin-bottom: 32px;
          max-width: 440px;
        }
        .hero-ctas {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 0;
        }
        .hero-dots {
          display: flex;
          gap: 12px;
          margin-top: 28px;
          align-items: center;
          justify-content: center;
        }
        .hero-card-col {
          width: 100%;
          display: flex;
          justify-content: center;
        }
        .dots-nav-btn {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--text-muted);
          transition: all 0.2s;
          font-size: 14px;
        }
        .badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--cyan);
          animation: dotPulse 1.5s ease-in-out infinite;
          display: inline-block;
        }

        /* ── Tablet (≥ 640px) ── */
        @media (min-width: 640px) {
          .hero-section { padding: 4rem 2rem; }
          .hero-inner { gap: 3rem; }
        }

        /* ── Desktop (≥ 1024px): side by side ── */
        @media (min-width: 1024px) {
          .hero-inner {
            grid-template-columns: 1fr 1fr;
          }
          .hero-text {
            align-items: flex-start;
            text-align: left;
          }
          .hero-ctas { justify-content: flex-start; }
          .hero-dots { justify-content: flex-start; }
          .hero-h1 { font-size: clamp(2.4rem, 4vw, 3.8rem); }
        }

        /* ── Animations ── */
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }

        .glitch-heading {
          position: relative;
          display: inline-block;
          animation: glitch-skew 2.2s infinite steps(1, end);
        }
        .glitch-heading::before,
        .glitch-heading::after {
          content: attr(data-text);
          position: absolute;
          left: 0; top: 0; width: 100%;
          pointer-events: none;
          opacity: 0;
        }
        .glitch-heading::before {
          color: #00ffe0;
          text-shadow: -3px 0 #00ffe0;
          animation: glitch-layer-1 1.8s infinite steps(2, end);
        }
        .glitch-heading::after {
          color: #ff2fd1;
          text-shadow: 3px 0 #ff2fd1;
          animation: glitch-layer-2 1.8s infinite steps(2, end);
        }
        @keyframes glitch-skew {
          0%, 80%, 100% { transform: none; }
          81% { transform: skewX(3deg); }
          82% { transform: skewX(-4deg); }
          83% { transform: skewX(2deg); }
          84% { transform: skewX(-2deg); }
        }
        @keyframes glitch-layer-1 {
          0%, 76%, 100% { opacity: 0; transform: translate(0); clip-path: inset(0 0 0 0); }
          77% { opacity: .95; transform: translate(-4px,-2px); clip-path: inset(6% 0 74% 0); }
          78% { opacity: .9;  transform: translate(4px,1px);   clip-path: inset(42% 0 30% 0); }
          79% { opacity: .95; transform: translate(-3px,1px);  clip-path: inset(70% 0 10% 0); }
        }
        @keyframes glitch-layer-2 {
          0%, 76%, 100% { opacity: 0; transform: translate(0); clip-path: inset(0 0 0 0); }
          77% { opacity: .85; transform: translate(3px,2px);   clip-path: inset(14% 0 62% 0); }
          78% { opacity: .8;  transform: translate(-4px,-2px); clip-path: inset(56% 0 22% 0); }
          79% { opacity: .85; transform: translate(2px,0);     clip-path: inset(76% 0 8% 0); }
        }
        .card-glitch-subtle {
          position: relative;
          animation: card-glitch-jitter 5s infinite steps(1, end);
          will-change: transform, filter;
        }
        .card-glitch-subtle::after {
          content: "";
          position: absolute;
          inset: 6% 4%;
          pointer-events: none;
          border-radius: 20px;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.06) 0px,
            rgba(255,255,255,0.06) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: card-glitch-flash 5s infinite steps(1, end);
        }
        @keyframes card-glitch-jitter {
          0%, 92%, 100% { transform: translate3d(0,0,0); filter: none; }
          93% { transform: translate3d(-1px,0,0); filter: hue-rotate(6deg); }
          94% { transform: translate3d(1px,-1px,0); filter: hue-rotate(-6deg); }
          95% { transform: translate3d(0,1px,0); filter: none; }
        }
        @keyframes card-glitch-flash {
          0%, 92%, 100% { opacity: 0; }
          93%, 94% { opacity: 0.25; }
          95%       { opacity: 0.12; }
        }
      `}</style>
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
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: f.dim, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 18, marginBottom: 12,
              flexShrink: 0,
            }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{f.desc}</div>
          </article>
        ))}
      </div>

      <style>{`
        .section-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 2.5rem 1.25rem;
        }
        /* 4 cols desktop, 2 cols tablet, 1 col mobile */
        .grid-4-2-1 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (min-width: 768px) {
          .grid-4-2-1 {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 479px) {
          .grid-4-2-1 {
            grid-template-columns: 1fr;
          }
        }
        /* 2 cols desktop, 2 cols tablet, 1 col mobile */
        .grid-2-1 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
        }
        @media (max-width: 479px) {
          .grid-2-1 { grid-template-columns: 1fr; }
        }
        /* 3 cols desktop, 2 cols tablet, 1 col mobile */
        .grid-3-2-1 {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }
        @media (min-width: 640px) {
          .grid-3-2-1 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (min-width: 1024px) {
          .grid-3-2-1 { grid-template-columns: repeat(3, 1fr); }
        }
        /* Steps: 3 cols desktop, 1 col mobile/tablet */
        .grid-steps {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
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
    <section className="section-container">
      <p className="section-label">Processus</p>
      <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Comment ça marche</h2>
      <div className="grid-steps">
        {steps.map((s) => (
          <article key={s.num} className="step-card">
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--cyan)", marginBottom: 14 }}>{s.num}</p>
            <div style={{ fontSize: 28, marginBottom: 14 }}>{s.icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.65 }}>{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PaymentSection() {
  return (
    <section className="section-container">
      <div className="payment-card">
        <p className="section-label">Paiements locaux</p>
        <h2 className="payment-title">Paiement 100% local, sécurisé et instantané</h2>
        <p className="payment-sub">
          Réglez facilement avec Djamo et Moov Money. Vos transactions sont protégées et validées en temps réel.
        </p>
        <div className="grid-2-1">
          <div style={{ borderRadius: 14, border: "1px solid var(--payment-cyan)", background: "var(--payment-cyan-dim)", padding: "18px 20px" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>💳 Djamo</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Paiement rapide, simple et fiable.</p>
          </div>
          <div style={{ borderRadius: 14, border: "1px solid var(--payment-amber)", background: "var(--payment-amber-dim)", padding: "18px 20px" }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>📱 Moov Money</p>
            <p style={{ fontSize: 13, color: "var(--text-muted)" }}>Moyen local populaire, instantané.</p>
          </div>
        </div>
      </div>

      <style>{`
        .payment-card {
          border-radius: 20px;
          border: 1px solid var(--border);
          background: var(--bg-card);
          padding: 1.5rem 1.25rem;
          backdrop-filter: blur(12px);
        }
        .payment-title {
          font-size: clamp(16px, 3vw, 22px);
          font-weight: 700;
          color: var(--text);
          margin: 6px 0 8px;
        }
        .payment-sub {
          font-size: 13px;
          color: var(--text-muted);
          max-width: 540px;
          line-height: 1.7;
          margin-bottom: 20px;
        }
        @media (min-width: 640px) {
          .payment-card { padding: 2rem 2.5rem; }
        }
      `}</style>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="section-container">
      <p className="section-label">Avis clients</p>
      <h2 className="section-title" style={{ marginBottom: 6 }}>Ils nous font confiance</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+1 200 clients satisfaits à Abidjan, Bouaké et partout en CI</p>
      <div className="grid-3-2-1">
        {testimonials.map((t) => (
          <article key={t.name} className="testi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: t.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {t.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{t.name}</div>
                <div style={{ fontSize: 12, color: "var(--text)" }}>{t.city}</div>
              </div>
            </div>
            <div style={{ color: "#ffb800", fontSize: 13, marginBottom: 10 }}>{"★".repeat(t.rating)}</div>
            <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 10 }}>{t.text}</p>
            <p style={{ fontSize: 12, color: "var(--text)" }}>{t.product}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="section-container" style={{ paddingBottom: "5rem" }}>
      <div className="grid-4-2-1">
        {stats.map((s) => (
          <div
            key={s.label}
            className="animate-count-up glass-cyan"
            style={{ borderRadius: 14, padding: "22px 20px", textAlign: "center" }}
          >
            <p style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "var(--text)" }}>{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
//  MOBILE BOTTOM NAV
// ─────────────────────────────────────────

function MobileBottomNav() {
  const [active, setActive] = useState("home");
  const items = [
    { id: "home",  label: "Accueil",  icon: "🏠", href: "/" },
    { id: "shop",  label: "Boutique", icon: "🛍️",  href: "/shop" },
    { id: "cart",  label: "Panier",   icon: "🛒",  href: "/cart" },
    { id: "account", label: "Compte", icon: "👤",  href: "/dashboard" },
  ];

  return (
    <>
      <nav className="mobile-bottom-nav" aria-label="Navigation mobile">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`mobile-nav-item ${active === item.id ? "active" : ""}`}
            onClick={() => setActive(item.id)}
            aria-current={active === item.id ? "page" : undefined}
          >
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Spacer so content isn't hidden under bottom nav on mobile */}
      <div className="mobile-nav-spacer" />

      <style>{`
        .mobile-bottom-nav {
          display: none;
        }
        @media (max-width: 767px) {
          .mobile-bottom-nav {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 60;
            background: color-mix(in srgb, var(--bg) 92%, transparent);
            border-top: 1px solid var(--border);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            height: 60px;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          .mobile-nav-spacer {
            height: 60px;
            display: block;
          }
          .mobile-nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            text-decoration: none;
            color: var(--text-muted);
            transition: color 0.2s;
            cursor: none;
            -webkit-tap-highlight-color: transparent;
          }
          .mobile-nav-item.active {
            color: var(--cyan);
          }
          .mobile-nav-icon {
            font-size: 18px;
            line-height: 1;
          }
          .mobile-nav-label {
            font-size: 10px;
            font-weight: 600;
            letter-spacing: 0.02em;
          }
        }
        @media (min-width: 768px) {
          .mobile-nav-spacer { display: none; }
        }
      `}</style>
    </>
  );
}

// ─────────────────────────────────────────
//  PAGE
// ─────────────────────────────────────────

export default function HomePage() {
  return (
    <main style={{ background: "var(--bg)", position: "relative" }}>
      <HeroCarousel />
      <FeaturesSection />
      <CategoriesSection />
      <StepsSection />
      <PaymentSection />
      <TestimonialsSection />
      <StatsSection />
      <MobileBottomNav />
    </main>
  );
}
