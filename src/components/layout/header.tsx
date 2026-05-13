"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", colorClass: "text-blue-400" },
  { slug: "xbox",        name: "Xbox",        icon: "🎯", colorClass: "text-green-400" },
  { slug: "nintendo",    name: "Nintendo",    icon: "🍄", colorClass: "text-red-400" },
  { slug: "apple",       name: "Apple",       icon: "🍎", colorClass: "text-gray-300" },
];

const navLinks = [
  { href: "/shop",      label: "Boutique" },
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

  return (
    <header
      className="fixed left-0 right-0 top-0 z-50"
      style={{
        background: "rgba(0,0,5,0.75)",
        borderBottom: "1px solid rgba(0,255,224,0.1)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        height: 64,
        display: "flex",
        alignItems: "center",
      }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4">

        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5" style={{ cursor: "none" }}>
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-black text-sm"
            style={{
              background: "linear-gradient(135deg, #00ffe0, #7b2fff)",
              boxShadow: "0 0 20px rgba(0,255,224,0.5)",
              animation: "logoPulse 3s ease-in-out infinite",
            }}
          >
            B
          </div>
          <span
            className="text-lg font-bold tracking-tight text-white transition-colors group-hover:text-[#00ffe0]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            BabiCard<span style={{ color: "#00ffe0" }}>.ci</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">

          {/* Catégories dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setCatsOpen(!catsOpen)}
              style={{ cursor: "none" }}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-2 text-white/60 transition-all",
                "hover:bg-white/5 hover:text-white",
                catsOpen ? "bg-white/5 text-white" : "",
              ].join(" ")}
            >
              Catégories
              <svg
                className={`h-3.5 w-3.5 transition-transform duration-200 ${catsOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {catsOpen && (
              <div
                className="dropdown-anim absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl shadow-2xl"
                style={{
                  background: "rgba(12,12,20,0.97)",
                  border: "1px solid rgba(0,255,224,0.12)",
                  backdropFilter: "blur(20px)",
                }}
              >
                <div className="p-1.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/shop?category=${cat.slug}`}
                      onClick={() => setCatsOpen(false)}
                      style={{ cursor: "none" }}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/60 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <span className="text-base">{cat.icon}</span>
                      <span className={cat.colorClass}>{cat.name}</span>
                    </Link>
                  ))}
                  <div className="my-1 border-t border-white/5" />
                  <Link
                    href="/shop"
                    onClick={() => setCatsOpen(false)}
                    style={{ cursor: "none" }}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all hover:bg-white/5"
                  >
                    <span className="text-base">🛍️</span>
                    <span style={{ color: "#00ffe0" }}>Toutes les cartes</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ cursor: "none" }}
              className={[
                "rounded-lg px-3 py-2 text-white/60 transition-all hover:bg-white/5 hover:text-white",
                pathname === link.href ? "bg-white/5 text-white" : "",
              ].join(" ")}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Cart */}
          <Link
            href="/cart"
            style={{ cursor: "none" }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/60 transition-all hover:text-white"
            aria-label="Panier"
            css-extra="border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05)"
          >
            <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-black"
                style={{ background: "#00ffe0", animation: "badgePulse 2s ease-in-out infinite" }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <Link
            href="/login"
            style={{ cursor: "none" }}
            className="btn-sm btn-outline"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            style={{ cursor: "none" }}
            className="btn-sm"
            css-extra="background:linear-gradient(135deg,#00ffe0,#00c8b0);color:#000;font-weight:700;box-shadow:0 0 20px rgba(0,255,224,0.3)"
          >
            S&apos;inscrire
          </Link>
        </div>

        {/* Mobile burger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link href="/cart" style={{ cursor: "none" }}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60"
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
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
            <span className={`h-0.5 w-5 bg-white transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          className="absolute left-0 right-0 top-16 flex flex-col px-4 py-4 md:hidden"
          style={{
            background: "rgba(0,0,5,0.98)",
            borderBottom: "1px solid rgba(0,255,224,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest text-white/25">Catégories</p>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/shop?category=${cat.slug}`}
              onClick={() => setMobileOpen(false)}
              style={{ cursor: "none" }}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-all"
            >
              <span>{cat.icon}</span>
              <span className={cat.colorClass}>{cat.name}</span>
            </Link>
          ))}
          <div className="my-3 border-t border-white/5" />
          <p className="mb-2 px-4 text-xs font-semibold uppercase tracking-widest text-white/25">Navigation</p>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{ cursor: "none" }}
              className={`rounded-lg px-4 py-3 text-white/60 hover:bg-white/5 hover:text-white transition-all ${pathname === link.href ? "bg-white/5 text-white" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/login" onClick={() => setMobileOpen(false)} style={{ cursor: "none" }}
              className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-medium text-white hover:bg-white/10 transition-all"
            >
              Connexion
            </Link>
            <Link href="/register" onClick={() => setMobileOpen(false)} style={{ cursor: "none" }}
              className="rounded-lg px-4 py-3 text-center text-sm font-bold text-black transition-all"
              style2="background:linear-gradient(135deg,#00ffe0,#00c8b0)"
            >
              S&apos;inscrire gratuitement
            </Link>
          </div>
        </nav>
      )}

      <style>{`
        @keyframes logoPulse {
          0%,100% { box-shadow: 0 0 20px rgba(0,255,224,0.5); }
          50%      { box-shadow: 0 0 40px rgba(0,255,224,0.9), 0 0 80px rgba(123,47,255,0.4); }
        }
        @keyframes badgePulse {
          0%,100% { transform: scale(1); }
          50%      { transform: scale(1.25); }
        }
      `}</style>
    </header>
  );
}