"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

// FCFA conversion
const EUR_TO_FCFA = 655;
const toFCFA = (eur: number) => (eur * EUR_TO_FCFA).toLocaleString("fr-FR");

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
  { icon: "⚡", title: "Livraison < 2 min",   desc: "Code livré instantanément par email après paiement", accent: "#00ffe0", dim: "rgba(0,255,224,0.1)" },
  { icon: "🔐", title: "Paiement sécurisé",   desc: "Djamo, Moov Money & Wave acceptés",                  accent: "#7b2fff", dim: "rgba(123,47,255,0.1)" },
  { icon: "✅", title: "100% Officiel",        desc: "Codes authentiques garantis, jamais utilisés",       accent: "#00ff88", dim: "rgba(0,255,136,0.1)" },
  { icon: "💬", title: "Support 24/7",         desc: "Assistance rapide sur WhatsApp",                     accent: "#ffb800", dim: "rgba(255,184,0,0.1)" },
];

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", desc: "PSN, PS Plus, PS Stars", cssClass: "gradient-psn  border-psn  glow-psn", count: "12 cartes" },
  { slug: "xbox", name: "Xbox", icon: "🎯", desc: "Xbox Live, Game Pass", cssClass: "gradient-xbox border-xbox glow-xbox", count: "8 cartes" },
  { slug: "nintendo", name: "Nintendo", icon: "🍄", desc: "eShop, NSO", cssClass: "gradient-nintendo border-nintendo glow-nintendo", count: "6 cartes" },
  { slug: "apple", name: "Apple", icon: "🍎", desc: "iTunes, App Store", cssClass: "gradient-apple border-apple glow-apple", count: "5 cartes" },
];

const productsByCategory: Record<string, { id: string; name: string; eur: number; tag: string; image: string }[]> = {
  playstation: [
    { id: "psn-10", name: "Carte PSN US 10€", eur: 10, tag: "Instantané", image: "🎮" },
    { id: "psn-20", name: "Carte PSN US 20€", eur: 20, tag: "Best seller", image: "🎮" },
    { id: "psn-50", name: "Carte PSN US 50€", eur: 50, tag: "Top up", image: "🎮" },
  ],
  xbox: [
    { id: "xbox-10", name: "Xbox Gift Card 10€", eur: 10, tag: "Game Pass", image: "🎯" },
    { id: "xbox-25", name: "Xbox Gift Card 25€", eur: 25, tag: "Populaire", image: "🎯" },
    { id: "xbox-50", name: "Xbox Gift Card 50€", eur: 50, tag: "Top up", image: "🎯" },
  ],
  nintendo: [
    { id: "nin-10", name: "Nintendo eShop 10€", eur: 10, tag: "Switch", image: "🍄" },
    { id: "nin-20", name: "Nintendo eShop 20€", eur: 20, tag: "NSO", image: "🍄" },
    { id: "nin-35", name: "Nintendo eShop 35€", eur: 35, tag: "Famille", image: "🍄" },
  ],
  apple: [
    { id: "app-5", name: "iTunes/App Store 5€", eur: 5, tag: "Starter", image: "🍎" },
    { id: "app-10", name: "iTunes/App Store 10€", eur: 10, tag: "Populaire", image: "🍎" },
    { id: "app-25", name: "iTunes/App Store 25€", eur: 25, tag: "Premium", image: "🍎" },
  ],
};

const steps = [
  { num: "01", icon: "🛒", title: "Choisissez votre carte",  desc: "Parcourez le catalogue et sélectionnez la carte et le montant souhaités." },
  { num: "02", icon: "💳", title: "Payez en sécurité",       desc: "Réglez avec Djamo, Moov Money ou Wave. 100% sécurisé et instantané." },
  { num: "03", icon: "📧", title: "Recevez votre code",      desc: "Votre code est livré par email en moins de 2 minutes. Prêt à l'emploi !" },
];

const testimonials = [
  { name: "Kouamé A.", city: "Abidjan", initials: "K", color: "#2563eb", rating: 5, text: "Incroyable ! J'ai reçu mon code PSN en moins d'une minute. Le paiement Djamo est super pratique. Je recommande à 100% !", product: "PSN 20€" },
  { name: "Fatou D.",  city: "Bouaké",  initials: "F", color: "#7c3aed", rating: 5, text: "Service rapide et fiable. J'ai acheté une carte iTunes pour mon fils, le code a fonctionné immédiatement. Merci AdexCard !", product: "iTunes 10€" },
  { name: "Yves K.",   city: "Abidjan", initials: "Y", color: "#16a34a", rating: 5, text: "Le meilleur site pour acheter des cartes gaming en Côte d'Ivoire. Prix corrects et livraison ultra rapide. Mon go-to !", product: "Xbox 25€" },
];

const stats = [
  { value: "1 200+", label: "Clients satisfaits" },
  { value: "< 2 min", label: "Délai de livraison" },
  { value: "100%", label: "Codes authentiques" },
  { value: "24/7", label: "Support disponible" },
];

// ─────────────────────────────────────────
//  HERO 3D CARD
// ─────────────────────────────────────────

function HeroCard({ platform }: { platform: typeof platforms[0] }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [amtIdx, setAmtIdx] = useState(0);

  function onMouseMove(e: React.MouseEvent) {
    const card = cardRef.current;
    const shine = shineRef.current;
    if (!card) return;
    const r = card.getBoundingClientRect();
    const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
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
    const card = cardRef.current;
    const shine = shineRef.current;
    if (card) card.style.transform = "perspective(1200px) rotateY(0deg) rotateX(0deg) scale(1)";
    if (shine) shine.style.background = "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)";
  }

  const amt = platform.amounts[amtIdx];

  return (
    <div ref={wrapRef} className="flex items-center justify-center" onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      <div style={{ position: "relative", width: "min(300px, 80vw)" }}>
        {/* Rainbow border glow */}
        <div className="card-rainbow-border" />

        {/* Card */}
        <div
          ref={cardRef}
          style={{
            width: "100%",
            height: "min(400px, 106vw)",
            borderRadius: 24,
            background: platform.cardBg,
            border: `1px solid ${platform.cardBorder}`,
            position: "relative",
            overflow: "hidden",
            transformStyle: "preserve-3d",
            transition: "transform 0.08s linear",
            boxShadow: `0 30px 80px rgba(0,0,0,0.6), 0 0 60px ${platform.glowColor}`,
          }}
        >
          {/* Scanlines */}
          <div className="scanline-overlay" />
          {/* Shine */}
          <div ref={shineRef} style={{
            position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none", borderRadius: 24,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1), transparent 60%)",
            transition: "background 0.05s",
          }} />

          {/* Content */}
          <div style={{ padding: 28, height: "100%", display: "flex", flexDirection: "column", position: "relative", zIndex: 2 }}>
            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: platform.badgeBg, border: `1px solid ${platform.badgeBorder}`,
              color: platform.badgeColor,
              padding: "6px 14px", borderRadius: 999,
              fontSize: 12, fontWeight: 600, width: "fit-content", marginBottom: 8,
            }}>
              {platform.badge}
            </div>

            {/* Icon */}
            <div style={{ fontSize: 56, margin: "auto 0", animation: "iconFloat 3s ease-in-out infinite", textShadow: "0 0 30px rgba(0,255,224,0.4)" }}>
              {platform.icon}
            </div>

            {/* Info */}
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{platform.title}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>{platform.subtitle} · Livraison instantanée</div>

              {/* Amount picker */}
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                {platform.amounts.map((a, i) => (
                  <button
                    key={a}
                    onClick={() => setAmtIdx(i)}
                    style={{
                      padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "none",
                      border: amtIdx === i ? "1px solid rgba(0,255,224,0.5)" : "1px solid rgba(255,255,255,0.1)",
                      background: amtIdx === i ? "rgba(0,255,224,0.12)" : "rgba(255,255,255,0.04)",
                      color: amtIdx === i ? "#00ffe0" : "rgba(255,255,255,0.7)",
                      transition: "all 0.2s",
                    }}
                  >
                    {a}€
                  </button>
                ))}
              </div>

              <div style={{ fontSize: 26, fontWeight: 800 }}>
                <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  {amt}€
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 8, WebkitTextFillColor: "rgba(255,255,255,0.4)" }}>
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
  const [idx, setIdx] = useState(0);
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
      style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", position: "relative", overflow: "hidden" }}
      className="flex items-center justify-center px-4 py-16"
    >

      <div style={{ maxWidth: 1100, width: "100%", position: "relative", zIndex: 2 }} className="grid gap-12 lg:grid-cols-2 items-center text-center lg:text-left">

{/* Left text */}
       <div
         style={{
           opacity: animating ? 0 : 1,
           transform: animating ? "translateX(16px)" : "translateX(0)",
           transition: "opacity 0.28s, transform 0.28s",
         }}
         className="flex flex-col items-center lg:items-start"
       >
          {/* Live badge */}
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 24 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            En stock · Livraison instantanée
          </div>

          {/* Heading */}
          <h1
            className="glitch-heading"
            data-text="Cartes gaming"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              color: "var(--text)",
              marginBottom: 20,
              letterSpacing: "-1px",
              fontFamily: "var(--font-display)",
            }}
          >
            Cartes gaming<br />
            <span className="text-gradient-cyan">Côte d&apos;Ivoire</span>
          </h1>

          <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.75, marginBottom: 32, maxWidth: 440 }}>
            {p.title} — payez avec Djamo ou Moov Money. Code livré en moins de 2 minutes.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center", alignContent: "center" }} className="lg:justify-start">
            <Link href={`/shop?category=${p.slug}`} className="btn-primary animate-cta">
              Acheter maintenant
              <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link href="/shop" className="btn-outline">Voir le catalogue</Link>
          </div>

{/* Platform dots */}
<div style={{ display: "flex", gap: 12, marginTop: 36, alignItems: "center", justifyContent: "center" }} className="lg:justify-start">
  {/* Nav arrows */}
  <button onClick={goPrev} style={{ cursor: "none", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-muted)", transition: "all 0.2s" }}>←</button>
  {platforms.map((_, i) => (
    <button
      key={i}
      onClick={() => goTo(i)}
      style={{
        cursor: "none",
        width: i === idx ? 32 : 8, height: 8, borderRadius: 999,
        background: i === idx ? "var(--cyan)" : "var(--border)",
        boxShadow: i === idx ? "0 0 12px var(--cyan-glow)" : "none",
        border: "none", transition: "all 0.3s",
      }}
    />
  ))}
  <button onClick={goNext} style={{ cursor: "none", background: "var(--bg3)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", color: "var(--text-muted)", transition: "all 0.2s" }}>→</button>
</div>
        </div>

        {/* Right 3D card */}
        <div
          className="card-glitch-subtle"
          style={{ opacity: animating ? 0 : 1, transform: animating ? "scale(0.94)" : "scale(1)", transition: "opacity 0.28s, transform 0.28s" }}
        >
          <HeroCard platform={p} />
        </div>
      </div>

      <style>{`
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
          left: 0;
          top: 0;
          width: 100%;
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
          0%, 76%, 100% {
            opacity: 0;
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          77% {
            opacity: .95;
            transform: translate(-4px, -2px);
            clip-path: inset(6% 0 74% 0);
          }
          78% {
            opacity: .9;
            transform: translate(4px, 1px);
            clip-path: inset(42% 0 30% 0);
          }
          79% {
            opacity: .95;
            transform: translate(-3px, 1px);
            clip-path: inset(70% 0 10% 0);
          }
        }

        @keyframes glitch-layer-2 {
          0%, 76%, 100% {
            opacity: 0;
            transform: translate(0);
            clip-path: inset(0 0 0 0);
          }
          77% {
            opacity: .85;
            transform: translate(3px, 2px);
            clip-path: inset(14% 0 62% 0);
          }
          78% {
            opacity: .8;
            transform: translate(-4px, -2px);
            clip-path: inset(56% 0 22% 0);
          }
          79% {
            opacity: .85;
            transform: translate(2px, 0);
            clip-path: inset(76% 0 8% 0);
          }
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
            rgba(255, 255, 255, 0.06) 0px,
            rgba(255, 255, 255, 0.06) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: card-glitch-flash 5s infinite steps(1, end);
        }

        @keyframes card-glitch-jitter {
          0%, 92%, 100% { transform: translate3d(0, 0, 0); filter: none; }
          93% { transform: translate3d(-1px, 0, 0); filter: hue-rotate(6deg); }
          94% { transform: translate3d(1px, -1px, 0); filter: hue-rotate(-6deg); }
          95% { transform: translate3d(0, 1px, 0); filter: none; }
        }

        @keyframes card-glitch-flash {
          0%, 92%, 100% { opacity: 0; }
          93%, 94% { opacity: 0.25; }
          95% { opacity: 0.12; }
        }

        .card-glitch-subtle::after {
          content: "";
          position: absolute;
          inset: 6% 4%;
          pointer-events: none;
          border-radius: 20px;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.06) 0px,
            rgba(255, 255, 255, 0.06) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: screen;
          opacity: 0;
          animation: card-glitch-flash 5s infinite steps(1, end);
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
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-md:grid-cols-2 max-sm:grid-cols-1">
        {features.map((f) => (
          <article key={f.title} className="feat-card">
            <div style={{ width: 40, height: 40, borderRadius: 10, background: f.dim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginBottom: 12 }}>
              {f.icon}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{f.title}</div>
            <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6 }}>{f.desc}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sliceAnimating, setSliceAnimating] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCategoryClick = (slug: string) => {
    setActiveCategory(slug);
    setSliceAnimating(slug);
    window.setTimeout(() => {
      setSliceAnimating(null);
      setModalOpen(true);
    }, 620);
  };

  const closeModal = () => setModalOpen(false);

  const activeProducts = activeCategory ? productsByCategory[activeCategory] ?? [] : [];

  useEffect(() => {
    if (!modalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [modalOpen]);

  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 3rem" }}>
      <p className="section-label">Catégories</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20, flexWrap: "wrap", gap: 12 }} className="flex-col sm:flex-row">
        <h2 className="section-title">Par plateforme</h2>
        <Link href="/shop" style={{ color: "#00ffe0", fontSize: 14, fontWeight: 500, textDecoration: "none", cursor: "none" }}>
          Voir tout →
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-md:grid-cols-2 max-sm:grid-cols-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const isSlicing = sliceAnimating === cat.slug;

          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              style={{
                textDecoration: "none",
                borderRadius: 18,
                padding: 22,
                display: "block",
                transition: "all 0.3s",
                border: "none",
                textAlign: "left",
                cursor: "none",
              }}
              className={`${cat.cssClass} category-glitch-card ${isSlicing ? "is-slicing" : ""} ${isActive ? "is-active" : ""}`}
              data-title={cat.name}
              aria-pressed={isActive}
            >
              <div className="category-slice-top" />
              <div className="category-slice-bottom" />
              <span style={{ fontSize: 36, display: "block", marginBottom: 12 }} className="category-glitch-icon">{cat.icon}</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4 }} className="category-glitch-title">{cat.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{cat.desc}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{cat.count}</div>
            </button>
          );
        })}
      </div>

      {modalOpen && activeCategory && (
        <div className="products-modal-backdrop" onClick={closeModal}>
          <div className="products-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-noise" />
            <div className="products-modal-head">
              <div>
                <p className="section-label" style={{ marginBottom: 4 }}>Catalogue</p>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 6, lineHeight: 1.2, textTransform: "uppercase" }}>
                  {categories.find((c) => c.slug === activeCategory)?.name}
                </h3>
              </div>

              <button className="products-modal-close" onClick={closeModal} aria-label="Fermer">
                ✕
              </button>
            </div>

            <div className="products-modal-grid">
              {activeProducts.map((p) => (
                <div key={p.id} className="products-modal-item">
                  <div className="products-modal-item-media" aria-hidden="true">{p.image}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: "var(--text)" }}>{p.tag}</span>
                    <span style={{ fontSize: 11, color: "var(--cyann)" }}>{toFCFA(p.eur)} FCFA</span>
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text)", fontWeight: 700, marginBottom: 6 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 10, fontWeight: 800 }}>{p.eur}€</div>
                  <button
                    type="button"
                    className="products-modal-add-btn"
                    aria-label={`Ajouter ${p.name} au panier`}
                  >
                    Ajouter au panier
                  </button>
                </div>
              ))}
            </div>

            <div className="products-modal-foot">
              <Link href={`/shop?category=${activeCategory}`} className="btn-primary" onClick={closeModal}>
                Voir toute la catégorie
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .category-glitch-card {
          position: relative;
          overflow: hidden;
          transform: translateZ(0);
          isolation: isolate;
          will-change: transform, clip-path, filter;
        }

        .category-slice-top,
        .category-slice-bottom {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
        }

        .category-slice-top {
          background: linear-gradient(120deg, rgba(0,255,224,0.2), transparent 55%);
        }

        .category-slice-bottom {
          background: linear-gradient(300deg, rgba(255,47,209,0.2), transparent 55%);
        }

        .category-glitch-card::before,
        .category-glitch-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .category-glitch-card::before {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.07) 0px,
            rgba(255, 255, 255, 0.07) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: screen;
        }

        .category-glitch-card::after {
          box-shadow:
            inset -2px 0 0 rgba(0, 255, 255, 0.35),
            inset 2px 0 0 rgba(255, 0, 153, 0.3);
        }

        .category-glitch-title,
        .category-glitch-icon {
          position: relative;
          display: inline-block;
          will-change: transform, text-shadow, filter;
        }

        .category-glitch-card.is-active {
          box-shadow: 0 0 24px rgba(0, 255, 224, 0.18), 0 0 38px rgba(123, 47, 255, 0.15);
        }

        .category-glitch-card.is-slicing {
          animation: cat-oblique-slice 620ms cubic-bezier(.2,.7,.2,1) 1;
        }

        .category-glitch-card.is-slicing::before,
        .category-glitch-card.is-slicing::after {
          opacity: 1;
          animation: cat-oblique-overlay 620ms steps(2, end) 1;
        }

        .category-glitch-card.is-slicing .category-slice-top {
          opacity: 1;
          animation: cat-slice-top 620ms cubic-bezier(.2,.7,.2,1) 1;
        }

        .category-glitch-card.is-slicing .category-slice-bottom {
          opacity: 1;
          animation: cat-slice-bottom 620ms cubic-bezier(.2,.7,.2,1) 1;
        }

        .category-glitch-card.is-slicing .category-glitch-title {
          animation: cat-title-oblique-slice 620ms steps(2, end) 1;
          text-shadow:
            -3px 0 rgba(0, 255, 255, 0.95),
            3px 0 rgba(255, 0, 153, 0.9),
            0 0 16px rgba(0, 255, 224, 0.45);
        }

        .category-glitch-card.is-slicing .category-glitch-icon {
          animation: cat-icon-oblique-slice 620ms steps(2, end) 1;
          filter: drop-shadow(0 0 14px rgba(0, 255, 224, 0.55));
        }

        .products-modal-backdrop {
          position: fixed;
          inset: 0;
          background: color-mix(in srgb, var(--bg) 78%, transparent);
          backdrop-filter: blur(7px);
          z-index: 90;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modal-backdrop-in 260ms ease-out 1;
        }

        .products-modal-card {
          width: min(820px, 100%);
          border-radius: 20px;
          border: 1px solid var(--border-cyan);
          background: linear-gradient(145deg, color-mix(in srgb, var(--bg2) 90%, transparent), color-mix(in srgb, var(--bg3) 88%, transparent));
          box-shadow: var(--shadow-xl), 0 0 0 1px color-mix(in srgb, var(--text) 6%, transparent), 0 0 30px var(--cyan-glow);
          padding: 18px;
          position: relative;
          overflow: hidden;
          animation: modal-card-in 320ms cubic-bezier(.2,.7,.2,1) 1;
        }

        .products-modal-noise {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.12;
          background: repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.06) 0px,
            rgba(255,255,255,0.06) 1px,
            transparent 2px,
            transparent 4px
          );
          mix-blend-mode: screen;
          animation: modal-noise 1.2s steps(2, end) infinite;
        }

        .products-modal-head {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 14px;
        }

        .products-modal-close {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-card) 86%, transparent);
          color: var(--text);
          cursor: none;
        }

        .products-modal-grid {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .products-modal-item {
          display: block;
          text-decoration: none;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-card) 92%, transparent);
          padding: 12px;
          transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
          cursor: none;
        }

        .products-modal-item:hover {
          border-color: var(--border-cyan);
          transform: translateY(-2px);
          box-shadow: 0 0 14px var(--cyan-glow);
        }

        .products-modal-item-media {
          width: 100%;
          height: 88px;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: radial-gradient(
            circle at 30% 20%,
            color-mix(in srgb, var(--cyan) 20%, transparent),
            color-mix(in srgb, var(--violet) 14%, transparent) 45%,
            color-mix(in srgb, var(--bg2) 88%, transparent)
          );
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 34px;
          margin-bottom: 10px;
          box-shadow: inset 0 0 20px color-mix(in srgb, var(--cyan) 14%, transparent);
        }

        .products-modal-add-btn {
          width: 100%;
          border: 1px solid var(--border-cyan);
          background: linear-gradient(135deg, color-mix(in srgb, var(--cyan) 24%, transparent), color-mix(in srgb, var(--violet) 24%, transparent));
          color: var(--text);
          border-radius: 10px;
          padding: 8px 10px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: none;
          transition: all .2s ease;
        }

        .products-modal-add-btn:hover {
          border-color: var(--cyan);
          box-shadow: 0 0 14px var(--cyan-glow);
          transform: translateY(-1px);
        }

        .products-modal-foot {
          position: relative;
          z-index: 2;
          margin-top: 14px;
          display: flex;
          justify-content: flex-end;
        }

        @media (max-width: 768px) {
          .products-modal-grid {
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          }

          .products-modal-head {
            gap: 8px;
          }
        }

        @keyframes modal-backdrop-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes modal-card-in {
          from { opacity: 0; transform: translateY(10px) scale(.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes modal-noise {
          0%, 100% { opacity: .1; transform: translateY(0); }
          50% { opacity: .16; transform: translateY(1px); }
        }

        @keyframes cat-oblique-slice {
          0% { transform: translate3d(0,0,0) skewX(0deg); filter: none saturate(1); clip-path: polygon(0 0,100% 0,100% 100%,0 100%); }
          12% { transform: translate3d(-4px,2px,0) skewX(-12deg); filter: hue-rotate(12deg) saturate(1.3); clip-path: polygon(0 0,100% 0,92% 35%,0 58%); }
          24% { transform: translate3d(5px,-3px,0) skewX(14deg); filter: hue-rotate(-15deg) saturate(1.4) brightness(1.15); clip-path: polygon(0 15%,100% 0,100% 95%,0 72%); }
          38% { transform: translate3d(-3px,1px,0) skewX(-10deg); filter: hue-rotate(8deg) saturate(1.2); clip-path: polygon(0 8%,100% 5%,100% 88%,0 82%); }
          50% { transform: translate3d(4px,-2px,0) skewX(11deg); filter: hue-rotate(-10deg) saturate(1.25) brightness(1.1); clip-path: polygon(0 25%,100% 10%,100% 85%,0 60%); }
          66% { transform: translate3d(-2px,2px,0) skewX(-8deg); filter: hue-rotate(6deg) saturate(1.15); clip-path: polygon(0 5%,100% 12%,100% 92%,0 78%); }
          82% { transform: translate3d(3px,-1px,0) skewX(6deg); filter: hue-rotate(-8deg) saturate(1.2) brightness(1.08); clip-path: polygon(0 18%,100% 8%,100% 88%,0 72%); }
          100% { transform: translate3d(0,0,0) skewX(0deg); filter: none saturate(1); clip-path: polygon(0 0,100% 0,100% 100%,0 100%); }
        }

        @keyframes cat-oblique-overlay {
          0%, 100% { opacity: 0; }
          12% { opacity: .48; }
          24% { opacity: .52; }
          38% { opacity: .38; }
          50% { opacity: .45; }
          66% { opacity: .32; }
          82% { opacity: .18; }
        }

        @keyframes cat-slice-top {
          0% { opacity: 0; transform: translate(0,0) skewX(0deg); clip-path: polygon(0 0,100% 0,100% 48%,0 48%); }
          20% { opacity: 1; transform: translate(-24px,-10px) skewX(-22deg) rotateZ(-8deg); clip-path: polygon(0 0,100% 0,95% 45%,0 62%); }
          40% { opacity: .6; transform: translate(-12px,-5px) skewX(-12deg) rotateZ(-4deg); clip-path: polygon(0 0,100% 0,98% 46%,0 60%); }
          70% { opacity: .2; transform: translate(-4px,-2px) skewX(-4deg) rotateZ(-1deg); }
          100% { opacity: 0; transform: translate(0,0) skewX(0deg) rotateZ(0deg); }
        }

        @keyframes cat-slice-bottom {
          0% { opacity: 0; transform: translate(0,0) skewX(0deg); clip-path: polygon(0 52%,100% 52%,100% 100%,0 100%); }
          20% { opacity: 1; transform: translate(26px,12px) skewX(24deg) rotateZ(8deg); clip-path: polygon(0 38%,100% 52%,100% 100%,2% 100%); }
          40% { opacity: .6; transform: translate(14px,6px) skewX(14deg) rotateZ(4deg); clip-path: polygon(0 45%,100% 52%,100% 100%,3% 100%); }
          70% { opacity: .2; transform: translate(5px,2px) skewX(5deg) rotateZ(1deg); }
          100% { opacity: 0; transform: translate(0,0) skewX(0deg) rotateZ(0deg); }
        }

        @keyframes cat-title-oblique-slice {
          0% { transform: translate(0, 0) skewX(0deg) rotateZ(0deg); clip-path: inset(0 0 0 0); opacity: 1; }
          18% { transform: translate(-5px, 2px) skewX(-12deg) rotateZ(-2deg); clip-path: polygon(0 0,100% 0,100% 30%,0 56%); opacity: .95; }
          36% { transform: translate(5px, -2px) skewX(12deg) rotateZ(2deg); clip-path: polygon(0 28%,100% 12%,100% 100%,0 76%); opacity: .9; }
          54% { transform: translate(-3px, 1px) skewX(-8deg) rotateZ(-1deg); clip-path: polygon(0 8%,100% 0,100% 86%,0 98%); opacity: .92; }
          72% { transform: translate(3px, -1px) skewX(8deg) rotateZ(1deg); clip-path: polygon(0 16%,100% 8%,100% 90%,0 74%); opacity: .94; }
          100% { transform: translate(0, 0) skewX(0deg) rotateZ(0deg); clip-path: inset(0 0 0 0); opacity: 1; }
        }

        @keyframes cat-icon-oblique-slice {
          0% { transform: translate(0) rotate(0deg) skewX(0deg) scale(1); filter: brightness(1) drop-shadow(none); }
          15% { transform: translate(-4px, 2px) rotate(-12deg) skewX(-14deg) scale(1.1); filter: brightness(1.25) drop-shadow(0 0 20px rgba(0, 255, 224, 0.8)); }
          30% { transform: translate(4px, -2px) rotate(12deg) skewX(14deg) scale(1.08); filter: brightness(1.2) drop-shadow(0 0 18px rgba(255, 0, 153, 0.7)); }
          50% { transform: translate(-2px, 1px) rotate(-6deg) skewX(-8deg) scale(1.05); filter: brightness(1.15) drop-shadow(0 0 16px rgba(0, 255, 224, 0.6)); }
          70% { transform: translate(2px, -1px) rotate(6deg) skewX(8deg) scale(1.03); filter: brightness(1.1) drop-shadow(0 0 12px rgba(123, 47, 255, 0.5)); }
          100% { transform: translate(0) rotate(0deg) skewX(0deg) scale(1); filter: brightness(1) drop-shadow(none); }
        }

        @keyframes cat-glitch-jitter {
          0%   { transform: translate3d(0,0,0); }
          20%  { transform: translate3d(-1px, 1px, 0); }
          40%  { transform: translate3d(1px, -1px, 0); }
          60%  { transform: translate3d(-1px, 0, 0); }
          80%  { transform: translate3d(1px, 1px, 0); }
          100% { transform: translate3d(0,0,0); }
        }

        @keyframes cat-glitch-flash {
          0%, 100% { opacity: 0; }
          25%, 55% { opacity: 0.25; }
          75% { opacity: 0.12; }
        }

        @keyframes cat-title-glitch {
          0%   { transform: translate(0); clip-path: inset(0 0 0 0); }
          20%  { transform: translate(-2px, 0); clip-path: inset(62% 0 5% 0); }
          40%  { transform: translate(2px, 0); clip-path: inset(8% 0 68% 0); }
          60%  { transform: translate(-1px, 0); clip-path: inset(38% 0 28% 0); }
          80%  { transform: translate(1px, 0); clip-path: inset(78% 0 4% 0); }
          100% { transform: translate(0); clip-path: inset(0 0 0 0); }
        }

        @keyframes cat-icon-glitch {
          0%   { transform: translate(0) rotate(0deg); }
          25%  { transform: translate(-2px, 1px) rotate(-2deg); }
          50%  { transform: translate(2px, -1px) rotate(2deg); }
          75%  { transform: translate(-1px, 0) rotate(-1deg); }
          100% { transform: translate(0) rotate(0deg); }
        }

        @keyframes cat-glitch-pulse {
          0%, 100% {
            box-shadow: 0 0 0 rgba(0, 255, 224, 0);
          }
          50% {
            box-shadow: 0 0 18px rgba(0, 255, 224, 0.22), 0 0 30px rgba(123, 47, 255, 0.16);
          }
        }

        @keyframes cat-title-glow {
          0%, 100% {
            filter: brightness(1);
          }
          50% {
            filter: brightness(1.12);
          }
        }
      `}</style>
    </section>
  );
}

function StepsSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p className="section-label">Processus</p>
      <h2 className="section-title" style={{ marginBottom: "1.5rem" }}>Comment ça marche</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }} className="max-md:grid-cols-1">
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
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <div style={{ borderRadius: 20, border: "1px solid var(--border)", background: "var(--bg-card)", padding: "2rem 2.5rem", backdropFilter: "blur(12px)" }} className="max-sm:p-6">
        <p className="section-label">Paiements locaux</p>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "6px 0 8px" }} className="text-lg sm:text-2xl">Paiement 100% local, sécurisé et instantané</h2>
        <p style={{ fontSize: 13, color: "var(--text-muted)", maxWidth: 540, lineHeight: 1.7, marginBottom: 20 }}>
          Réglez facilement avec Djamo et Moov Money. Vos transactions sont protégées et validées en temps réel.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }} className="max-sm:grid-cols-1">
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
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <p className="section-label">Avis clients</p>
      <h2 className="section-title" style={{ marginBottom: 6 }}>Ils nous font confiance</h2>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 24 }}>+1 200 clients satisfaits à Abidjan, Bouaké et partout en CI</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }} className="max-md:grid-cols-2 max-sm:grid-cols-1">
        {testimonials.map((t) => (
          <article key={t.name} className="testi-card">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: t.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
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
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }} className="max-md:grid-cols-2 max-sm:grid-cols-1">
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
    </main>
  );
}