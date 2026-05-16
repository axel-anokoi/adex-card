"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuth } from "@/hooks/use-auth";

const categories = [
  { slug: "playstation", name: "PlayStation", icon: "🎮", colorClass: "text-blue-400" },
  { slug: "xbox",        name: "Xbox",        icon: "🎯", colorClass: "text-green-400" },
  { slug: "nintendo",    name: "Nintendo",    icon: "🍄", colorClass: "text-red-400" },
  { slug: "apple",       name: "Apple",       icon: "🍎", colorClass: "text-gray-400" },
];

const navLinks = [
  { href: "/shop", label: "Boutique" },
];

export function Header() {
  const pathname      = usePathname();
  const router = useRouter();
  const { isAuthenticated, isAdmin, user, supabase } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [catsOpen, setCatsOpen]     = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { totalItems: cartCount }          = useCart();
  const dropdownRef                 = useRef<HTMLDivElement>(null);
  const userDropdownRef            = useRef<HTMLDivElement>(null);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCatsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMobileOpen(false);
      setCatsOpen(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const softSurface = {
    border: "1px solid var(--border)",
    background: "color-mix(in srgb, var(--text) 6%, transparent)",
    color: "var(--text-muted)",
  } as const;

  const hoverSurface = "color-mix(in srgb, var(--text) 10%, transparent)";

  // Handle user sign out
  const handleSignOut = async () => {
    if (signingOut) return;

    setSigningOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Logout failed");
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error("Logout error:", error);
      await supabase.auth.signOut();
    } finally {
      router.replace("/");
      router.refresh();
      setSigningOut(false);
    }
  };

  // Get user display name
  const displayName = user?.email?.split("@")[0] || "Mon compte";

  return (
    <>
      <header
        className="site-header"
        style={{
          background: "color-mix(in srgb, var(--bg) 88%, transparent)",
          borderBottom: "1px solid var(--border)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="header-inner">

          {/* ── Logo ── */}
          <Link href="/" className="header-logo group">
            <div
              className="logo-box glitch-box"
              style={{
                background: "linear-gradient(135deg, var(--cyan), var(--violet))",
                boxShadow: "0 0 20px var(--cyan-glow)",
                animation: "logoPulse 3s ease-in-out infinite",
              }}
            >
              A
              <div className="glitch-layer" style={{ position: "absolute", inset: 0, borderRadius: "inherit" }} />
            </div>
            <span
              className="logo-text relative glitch-text"
              style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}
            >
              AdexCard<span style={{ color: "var(--cyan)" }}>.ci</span>
              <span className="glitch-layer-text" style={{ position: "absolute", inset: 0 }} />
            </span>
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="desktop-nav" aria-label="Navigation principale">
            {/* Categories dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setCatsOpen(!catsOpen)}
                style={{
                  color: catsOpen ? "var(--text)" : "var(--text-muted)",
                  background: catsOpen ? hoverSurface : "transparent",
                }}
                className="nav-link flex items-center gap-1.5"
                aria-expanded={catsOpen}
                aria-haspopup="true"
              >
                Catégories
                <svg
                  className={`dropdown-chevron ${catsOpen ? "rotated" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {catsOpen && (
                <div className="dropdown-menu dropdown-anim" role="menu">
                  <div style={{ padding: "6px" }}>
                    {categories.map((cat) => (
                      <Link
                        key={cat.slug}
                        href={`/shop?category=${cat.slug}`}
                        onClick={() => setCatsOpen(false)}
                        role="menuitem"
                        className="dropdown-item"
                        style={{ color: "var(--text-muted)" }}
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

                    <div style={{ margin: "4px 0", borderTop: "1px solid var(--border)" }} />

                    <Link
                      href="/shop"
                      onClick={() => setCatsOpen(false)}
                      role="menuitem"
                      className="dropdown-item"
                      style={{ color: "var(--text-muted)" }}
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

            {/* Other nav links */}
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    color: active ? "var(--text)" : "var(--text-muted)",
                    background: active ? hoverSurface : "transparent",
                  }}
                  className="nav-link"
                  aria-current={active ? "page" : undefined}
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

{/* ── Desktop actions ── */}
          <div className="desktop-actions">
            <ThemeToggle />

            <Link
              href="/cart"
              style={{ ...softSurface }}
              className="cart-btn relative"
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
              <svg className="w-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} article${cartCount > 1 ? "s" : ""}`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    color: "var(--text)",
                    background: userMenuOpen ? hoverSurface : "var(--bg)",
                    border: isAdmin ? "1px solid rgba(0,255,224,0.4)" : "1px solid var(--border)",
                    boxShadow: isAdmin ? "0 0 10px rgba(0,255,224,0.12)" : "none",
                  }}
                  className="nav-link flex items-center gap-1.5"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {isAdmin && (
                    <span style={{
                      fontSize: "9px", fontWeight: 800, letterSpacing: "0.06em",
                      background: "linear-gradient(135deg, var(--cyan), var(--violet))",
                      color: "#000", borderRadius: "4px", padding: "1px 5px",
                      textTransform: "uppercase", lineHeight: 1,
                    }}>
                      ADMIN
                    </span>
                  )}
                  {displayName}
                  <svg
                    className={`dropdown-chevron ${userMenuOpen ? "rotated" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

{userMenuOpen && (
                  <div className="dropdown-menu dropdown-anim" role="menu">
                    <div style={{ padding: "6px" }}>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="dropdown-item"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = hoverSurface;
                          e.currentTarget.style.color = "var(--text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                      >
                        <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>Mon compte</span>
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="dropdown-item"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = hoverSurface;
                          e.currentTarget.style.color = "var(--text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                      >
                        <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                        <span>Mon profil</span>
                      </Link>

                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        role="menuitem"
                        className="dropdown-item"
                        style={{ color: "var(--text-muted)" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = hoverSurface;
                          e.currentTarget.style.color = "var(--text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                      >
                        <span>🎁</span>
                        <span>Mes achats</span>
                      </Link>

                      <div style={{ margin: "4px 0", borderTop: "1px solid var(--border)" }} />

                      <button
                        type="button"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleSignOut();
                        }}
                        disabled={signingOut}
                        role="menuitem"
                        className="dropdown-item"
                        style={{ color: "var(--text-muted)", width: "100%", border: "none", background: "transparent", cursor: signingOut ? "wait" : "pointer" }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = hoverSurface;
                          e.currentTarget.style.color = "var(--text)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--text-muted)";
                        }}
                      >
                        <span>🚪</span>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="btn-sm btn-outline">
                  Connexion
                </Link>

                <Link
                  href="/register"
                  style={{
                    background: "linear-gradient(135deg,var(--cyan),#00c8b0)",
                    color: "#000",
                    fontWeight: 700,
                    boxShadow: "0 0 20px var(--cyan-glow)",
                  }}
                  className="btn-sm btn-register"
                >
                  S&apos;inscrire
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile actions ── */}
          <div className="mobile-actions">
            <ThemeToggle />

            <Link
              href="/cart"
              style={{ ...softSurface }}
              className="cart-btn relative"
              aria-label="Panier"
            >
              <svg className="w-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="cart-badge" aria-label={`${cartCount} article${cartCount > 1 ? "s" : ""}`}>
                  {cartCount}
                </span>
              )}
            </Link>

            {isAuthenticated && (
              <Link
                href="/dashboard"
                aria-label="Mon compte"
                className="cart-btn"
                style={{
                  ...softSurface,
                  border: isAdmin ? "1px solid rgba(0,255,224,0.4)" : softSurface.border,
                  boxShadow: isAdmin ? "0 0 10px rgba(0,255,224,0.12)" : "none",
                }}
              >
                <svg className="w-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </Link>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="hamburger-btn"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileOpen}
            >
              <span className={`ham-line ${mobileOpen ? "ham-open-1" : ""}`} />
              <span className={`ham-line ${mobileOpen ? "ham-open-2" : ""}`} />
              <span className={`ham-line ${mobileOpen ? "ham-open-3" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Mobile drawer ── */}
        {mobileOpen && (
          <nav
            className="mobile-drawer"
            aria-label="Menu mobile"
            style={{
              background: "color-mix(in srgb, var(--bg2) 96%, transparent)",
              borderBottom: "1px solid var(--border)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {/* Categories */}
            <p className="drawer-section-label">Catégories</p>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                style={{ color: "var(--text-muted)" }}
                className="drawer-link"
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

            <div style={{ margin: "8px 0", borderTop: "1px solid var(--border)" }} />

            {/* Main links */}
            <p className="drawer-section-label">Navigation</p>
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    color: active ? "var(--text)" : "var(--text-muted)",
                    background: active ? hoverSurface : "transparent",
                  }}
                  className="drawer-link"
                  aria-current={active ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

{/* Auth */}
            {isAuthenticated ? (
              <div className="drawer-auth">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  style={{ ...softSurface, textAlign: "center" }}
                  className="drawer-auth-btn"
                >
                  🏠 Mon compte
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  style={{ ...softSurface, textAlign: "center" }}
                  className="drawer-auth-btn"
                >
                  👤 Mon profil
                </Link>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  style={{ ...softSurface, textAlign: "center" }}
                  className="drawer-auth-btn"
                >
                  🎁 Mes achats
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                  disabled={signingOut}
                  style={{
                    ...softSurface,
                    textAlign: "center",
                    border: "none",
                    cursor: signingOut ? "wait" : "pointer",
                  }}
                  className="drawer-auth-btn"
                >
                  🚪 Déconnexion
                </button>
              </div>
            ) : (
              <div className="drawer-auth">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  style={{ ...softSurface, textAlign: "center" }}
                  className="drawer-auth-btn"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    background: "linear-gradient(135deg,var(--cyan),#00c8b0)",
                    color: "#000",
                  }}
                  className="drawer-auth-btn drawer-auth-register"
                >
                  S&apos;inscrire gratuitement
                </Link>
              </div>
            )}
          </nav>
        )}
      </header>

      {/* ── Styles ── */}
      <style>{`
        /* ── Header shell ── */
        .site-header {
          position: fixed;
          left: 0; right: 0; top: 0;
          z-index: 50;
          height: 64px;
        }
        .header-inner {
          margin: 0 auto;
          max-width: 1200px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          gap: 8px;
        }
        @media (min-width: 640px) {
          .header-inner { padding: 0 1.5rem; }
        }

        /* ── Logo ── */
        .header-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          text-decoration: none;
        }
        .logo-box {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 900;
          color: #000;
          flex-shrink: 0;
        }
        .logo-text {
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.02em;
          transition: color 0.2s;
          white-space: nowrap;
        }

        /* ── Desktop nav ── */
        .desktop-nav {
          display: none;
          align-items: center;
          gap: 2px;
          font-size: 13px;
          font-weight: 500;
        }
        @media (min-width: 768px) {
          .desktop-nav { display: flex; }
        }
        .nav-link {
          display: flex;
          align-items: center;
          border-radius: 8px;
          padding: 7px 12px;
          transition: all 0.15s;
          white-space: nowrap;
          text-decoration: none;
        }
        .dropdown-chevron {
          width: 14px; height: 14px;
          transition: transform 0.2s;
        }
        .dropdown-chevron.rotated { transform: rotate(180deg); }

        /* ── Dropdown ── */
        .dropdown-menu {
          position: absolute;
          left: 0; top: 100%;
          margin-top: 8px;
          width: 208px;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.35);
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg2) 92%, transparent);
          backdrop-filter: blur(20px);
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 8px;
          padding: 9px 12px;
          font-size: 13px;
          transition: all 0.15s;
          text-decoration: none;
        }

        /* ── Desktop actions ── */
        .desktop-actions {
          display: none;
          align-items: center;
          gap: 8px;
        }
        @media (min-width: 768px) {
          .desktop-actions { display: flex; }
        }
        .cart-btn {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px; height: 36px;
          border-radius: 8px;
          transition: all 0.15s;
          text-decoration: none;
          flex-shrink: 0;
        }
        .w-icon { width: 18px; height: 18px; }
        .cart-badge {
          position: absolute;
          right: -4px; top: -4px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px; height: 16px;
          border-radius: 50%;
          font-size: 10px;
          font-weight: 700;
          color: #000;
          background: var(--cyan);
          animation: badgePulse 2s ease-in-out infinite;
        }
        .btn-register {
          border-radius: 8px;
          padding: 7px 16px;
          transition: all 0.15s;
          font-size: 13px;
          white-space: nowrap;
        }

        /* ── Mobile actions ── */
        .mobile-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        @media (min-width: 768px) {
          .mobile-actions { display: none; }
        }

        /* ── Hamburger ── */
        .hamburger-btn {
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 8px;
          background: transparent;
          border: none;
        }
        .ham-line {
          display: block;
          width: 20px;
          height: 2px;
          border-radius: 2px;
          background: var(--text);
          transition: all 0.3s;
          transform-origin: center;
        }
        .ham-open-1 { transform: translateY(7px) rotate(45deg); }
        .ham-open-2 { transform: scaleX(0); opacity: 0; }
        .ham-open-3 { transform: translateY(-7px) rotate(-45deg); }

/* ── Mobile drawer ── */
        .mobile-drawer {
          position: absolute;
          left: 0; right: 0;
          top: 64px;
          z-index: 51;
          padding: 12px 16px 16px;
          /* Allow scroll if content overflows viewport height */
          max-height: calc(100vh - 64px - 60px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 768px) {
          .mobile-drawer { display: none; }
        }
        .drawer-section-label {
          padding: 4px 16px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-faint);
          margin-bottom: 4px;
        }
        .drawer-link {
          display: flex;
          align-items: center;
          gap: 12px;
          border-radius: 10px;
          padding: 11px 16px;
          font-size: 14px;
          transition: all 0.15s;
          text-decoration: none;
        }
        .drawer-auth {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 16px;
        }
        .drawer-auth-btn {
          display: block;
          border-radius: 10px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .drawer-auth-register {
          font-weight: 700;
          letter-spacing: 0.01em;
        }

        /* ── Animations ── */
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
          20% { transform: translate(-2px,2px); }
          40% { transform: translate(-2px,-2px); }
          60% { transform: translate(2px,2px); }
          80% { transform: translate(2px,-2px); }
          100% { transform: translate(0); }
        }
        @keyframes glitch-clip {
          0%   { clip-path: inset(50% 0 30% 0); }
          20%  { clip-path: inset(10% 0 80% 0); }
          40%  { clip-path: inset(40% 0 40% 0); }
          60%  { clip-path: inset(80% 0 10% 0); }
          80%  { clip-path: inset(30% 0 60% 0); }
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
          pointer-events: none;
        }

        /* ── Tablet: show a compact nav (≥ 640px < 768px) ── */
        @media (min-width: 640px) and (max-width: 767px) {
          .desktop-nav {
            display: flex;
          }
          .desktop-actions {
            display: none;
          }
          .mobile-actions {
            display: flex;
          }
        }
      `}</style>
    </>
  );
}
