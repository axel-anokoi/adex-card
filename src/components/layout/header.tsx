"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", colorClass: "text-blue-400" },
  { slug: "xbox", name: "Xbox", icon: "🎯", colorClass: "text-green-400" },
  { slug: "nintendo", name: "Nintendo", icon: "🍄", colorClass: "text-red-400" },
  { slug: "apple", name: "Apple", icon: "🍎", colorClass: "text-gray-400" },
];

const navLinks = [
  { href: "/shop", label: "Boutique" },
  { href: "/dashboard", label: "Mon compte" },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [cartCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const softSurface = {
    border: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--text) 6%, transparent)",
    color: "var(--text-muted)",
  } as const;

  const hoverSurface = "color-mix(in srgb, var(--text) 10%, transparent)";

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      style={{
        background: "color-mix(in srgb, var(--bg) 88%, transparent)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        height: 64,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">
        <Link href="/" className="group flex items-center gap-2.5" style={{ cursor: "none" }}>
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black text-black glitch-box"
            style={{
              background: "linear-gradient(135deg, var(--cyan), var(--violet))",
              boxShadow: "0 0 20px var(--cyan-glow)",
              animation: "logoPulse 3s ease-in-out infinite",
            }}
          >
            A
            <div className="glitch-layer absolute inset-0 rounded-xl" />
          </div>
          <span
            className="relative text-lg font-bold tracking-tight transition-colors group-hover:text-[var(--cyan)] glitch-text"
            style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
          >
            AdexCard<span style={{ color: "var(--cyan)" }}>.ci</span>
            <span className="glitch-layer-text absolute inset-0" />
          </span>
        </Link>

        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCatsOpen(!catsOpen)}
              style={{
                cursor: "none",
                color: catsOpen ? "var(--text)" : "var(--text-muted)",
                background: catsOpen ? hoverSurface : "transparent",
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 transition-all"
            >
              Catégories
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${catsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {catsOpen && (
              <div
                className="dropdown-anim absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl shadow-2xl"
                style={{
                  background: "color-mix(in srgb, var(--bg2) 92%, transparent)",
                  border: "1px solid var(--border)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="p-1.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setCatsOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
                      style={{ cursor: "none", color: "var(--text-muted)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = hoverSurface;
                        e.currentTarget.style.color = "var(--text)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className={cat.colorClass}>{cat.name}</span>
                    </Link>
                  ))}

                  <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />

                  <Link
                    href="/shop"
                    onClick={() => setCatsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all"
                    style={{ cursor: "none", color: "var(--text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = hoverSurface;
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    <span className="text-base">🛍️</span>
                    <span style={{ color: "var(--cyan)" }}>Toutes les cartes</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  cursor: "none",
                  color: active ? "var(--text)" : "var(--text-muted)",
                  background: active ? hoverSurface : "transparent",
                }}
                className="rounded-lg px-3 py-2 transition-all"
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = hoverSurface;
                    e.currentTarget.style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />

          <Link
            href="/cart"
            style={{ cursor: "none", ...softSurface }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all"
            aria-label="Panier"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = hoverSurface;
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = softSurface.background;
              e.currentTarget.style.color = softSurface.color;
            }}
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black"
                style={{ background: "var(--cyan)", animation: "badgePulse 2s ease-in-out infinite" }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link href="/login" style={{ cursor: "none" }} className="btn-sm btn-outline">
            Connexion
          </Link>

          <Link
            href="/register"
            style={{
              cursor: "none",
              background: "linear-gradient(135deg,var(--cyan),#00c8b0)",
              color: "#000",
              fontWeight: 700,
              boxShadow: "0 0 20px var(--cyan-glow)",
            }}
            className="btn-sm rounded-lg px-4 py-2 transition-all"
          >
            S&apos;inscrire
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Link
            href="/cart"
            style={{ cursor: "none", ...softSurface }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex flex-col gap-1.5 p-2"
            aria-label="Menu"
            style={{ cursor: "none" }}
          >
            <span className={`h-0.5 w-5 transition-all duration-300 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} style={{ background: "var(--text)" }} />
            <span className={`h-0.5 w-5 transition-all duration-300 ${mobileOpen ? "scale-x-0 opacity-0" : ""}`} style={{ background: "var(--text)" }} />
            <span className={`h-0.5 w-5 transition-all duration-300 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} style={{ background: "var(--text)" }} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          className="absolute left-0 right-0 top-16 flex flex-col px-4 py-4 md:hidden"
          style={{
            background: "color-mix(in srgb, var(--bg2) 96%, transparent)",
            borderBottom: "1px solid var(--border)",
            backdropFilter: "blur(20px)",
          }}
        >
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Catégories
          </p>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              onClick={() => setMobileOpen(false)}
              style={{ cursor: "none", color: "var(--text-muted)" }}
              className="flex items-center gap-3 rounded-lg px-4 py-3 transition-all"
              onMouseEnter={(e) => {
                e.currentTarget.style.background = hoverSurface;
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <span>{cat.icon}</span>
              <span className={cat.colorClass}>{cat.name}</span>
            </Link>
          ))}
          <div className="my-3 border-t" style={{ borderColor: "var(--border)" }} />
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
            Navigation
          </p>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  cursor: "none",
                  color: active ? "var(--text)" : "var(--text-muted)",
                  background: active ? hoverSurface : "transparent",
                }}
                className="rounded-lg px-4 py-3 transition-all"
              >
                {link.label}
              </Link>
            );
          })}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{ cursor: "none", ...softSurface, textAlign: "center" }}
              className="rounded-lg px-4 py-3 text-sm font-medium transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              style={{
                cursor: "none",
                background: "linear-gradient(135deg,var(--cyan),#00c8b0)",
                color: "#000",
              }}
              className="rounded-lg px-4 py-3 text-center text-sm font-bold transition-all"
            >
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </nav>
      )}

      <style>{`
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 0 20px var(--cyan-glow); }
          50% { box-shadow: 0 0 40px var(--cyan-glow), 0 0 80px color-mix(in srgb, var(--violet) 40%, transparent); }
        }
        @keyframes badgePulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.25); }
        }
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        @keyframes glitch-clip {
          0% { clip-path: inset(50% 0 30% 0); }
          20% { clip-path: inset(10% 0 80% 0); }
          40% { clip-path: inset(40% 0 40% 0); }
          60% { clip-path: inset(80% 0 10% 0); }
          80% { clip-path: inset(30% 0 60% 0); }
          100% { clip-path: inset(50% 0 30% 0); }
        }
        .glitch-box:hover .glitch-layer {
          animation: glitch 0.2s linear infinite;
          background: var(--cyan);
          opacity: 0.5;
          mix-blend-mode: screen;
        }
        .glitch-text:hover {
          animation: glitch 0.3s linear infinite;
        }
        .glitch-text:hover .glitch-layer-text {
          animation: glitch-clip 0.2s linear infinite;
          background: var(--cyan);
          color: var(--text);
          mix-blend-mode: difference;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          position: absolute;
          pointer-events: none;
        }
      `}</style>
    </header>
  );
}
