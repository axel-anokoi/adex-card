"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";

// FCFA conversion
const EUR_TO_FCFA = 655;
const toFCFA = (eur: number) => (eur * EUR_TO_FCFA).toLocaleString("fr-FR");


const paymentMethods = [
  { id: "djamo", label: "Djamo", icon: "💳", desc: "Carte prépayée Djamo", accent: "rgba(0,255,224,0.2)", border: "rgba(0,255,224,0.35)" },
  { id: "moov", label: "Moov Money", icon: "📱", desc: "Mobile money Moov", accent: "rgba(255,184,0,0.15)", border: "rgba(255,184,0,0.35)" },
  { id: "wave", label: "Wave", icon: "🌊", desc: "Paiement Wave CI", accent: "rgba(123,47,255,0.15)", border: "rgba(123,47,255,0.35)" },
];

export default function CheckoutPage() {
  const { cart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState("djamo");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [userData, setUserData] = useState({
    fullName: "",
    phone: "",
    email: "",
  });

  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("nom, prenoms, telephone, email")
            .eq("id", user.id)
            .single();

          if (profile) {
            setUserData({
              fullName: profile.nom+" "+profile.prenoms || "",
              phone: profile.telephone || "",
              email: profile.email || user.email || "",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setUserLoading(false);
      }
    }
    fetchUser();
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.eur * item.quantity, 0);
  const discount = appliedPromo?.discount || 0;
  const total = subtotal - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    
    setPromoLoading(true);
    setPromoError(null);
    
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: promoCode.trim().toUpperCase(),
          order_amount: subtotal,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.is_valid) {
        setAppliedPromo({ code: promoCode.trim().toUpperCase(), discount: data.discount_applied });
        setPromoCode("");
      } else {
        setPromoError(data.error || "Code invalide");
      }
    } catch (error) {
      setPromoError("Erreur de validation");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
  };

  const handleCheckout = async () => {
    if (!userData.fullName || !userData.phone) {
      alert("Veuillez remplir les champs obligatoires (Nom et Téléphone)");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          paymentMethod: selectedPayment,
          customer: userData
        }),
      });
      const data = await response.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ background: "var(--bg)", minHeight: "100vh", padding: "5rem 1rem 3rem", position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
        backgroundSize: "40px 40px", pointerEvents: "none" }} />

      {/* Ambient glows */}
      <div style={{ position: "absolute", top: "20%", left: "20%", width: 400, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(0,255,224,0.04) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "15%", width: 350, height: 300, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(123,47,255,0.05) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{
        maxWidth: 900, margin: "0 auto", position: "relative", zIndex: 2,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
      }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div className="badge badge-cyan animate-badge" style={{ marginBottom: 14 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--cyan)", animation: "dotPulse 1.5s ease-in-out infinite", display: "inline-block" }} />
            Paiement sécurisé
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-display)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
            Finaliser la{" "}
            <span style={{ background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              commande
            </span>
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20, alignItems: "start" }} className="checkout-grid">

          {/* LEFT — Cart + Client Info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Cart items */}
            <section className="glass" style={{ borderRadius: 20, overflow: "hidden", position: "relative" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg, transparent, var(--cyan), transparent)" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 2px, transparent 4px)", zIndex: 1 }} />

              <div style={{ padding: "1.5rem", position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p className="section-label" style={{ margin: 0 }}>Votre panier</p>
                  <Link href="/shop" style={{ fontSize: 12, color: "var(--cyan)", textDecoration: "none" }}>+ Ajouter</Link>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ borderRadius: 12, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, transition: "border-color 0.2s" }}>
                      {/* Icon */}
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(0,255,224,0.07)", border: "1px solid rgba(0,255,224,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
                        {item.cat === 'gaming' ? '🎮' : '💎'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Qté : {item.quantity} · Instantané</p>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <p style={{ fontSize: 15, fontWeight: 700, background: "linear-gradient(135deg,#00ffe0,#7b2fff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                          {item.eur}€
                        </p>
                        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>{toFCFA(item.eur)} FCFA</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* User Identification */}
            <section className="glass" style={{ borderRadius: 20, overflow: "hidden", position: "relative" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg, transparent, var(--cyan), transparent)" }} />
              <div style={{ padding: "1.5rem" }}>
                <p className="section-label" style={{ marginBottom: 14 }}>Informations client</p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Nom et Prénoms *</label>
                    <input
                      type="text"
                      value={userData.fullName}
                      onChange={(e) => setUserData({...userData, fullName: e.target.value})}
                      placeholder="Ex: Jean Dupont"
                      style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Téléphone *</label>
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                      placeholder="Ex: +225 0102030405"
                      style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Email (Optionnel)</label>
                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                      placeholder="exemple@mail.com"
                      style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)", color: "var(--text)", fontSize: 14, outline: "none" }}
                    />
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* RIGHT — Order summary */}
          <div style={{ position: "sticky", top: 80 }}>
           <div className="glass-cyan" style={{ borderRadius: 20, boxShadow: "var(--shadow-xl)", overflow: "hidden", position: "relative" }}>
              <div style={{ height: 2, background: "linear-gradient(90deg, transparent, #00ffe0, transparent)" }} />
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 2px, transparent 4px)", zIndex: 1 }} />

              <div style={{ padding: "1.5rem", position: "relative", zIndex: 2 }}>
                <p className="section-label" style={{ marginBottom: 18 }}>Récapitulatif</p>

                {/* Payment Method inside Summary */}
                <div style={{ marginBottom: 20 }}>
                  <p className="section-label" style={{ marginBottom: 12, fontSize: 12 }}>Méthode de paiement</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(1, 1fr)", gap: 10 }} className="payment-methods-grid">
                    {paymentMethods.map((pm) => (
                      <button
                        key={pm.id}
                        onClick={() => setSelectedPayment(pm.id)}
                        style={{
                          borderRadius: 12, padding: "10px 8px", textAlign: "center",
                          border: selectedPayment === pm.id ? `1px solid ${pm.border}` : "1px solid var(--border)",
                          background: selectedPayment === pm.id ? pm.accent : "rgba(255,255,255,0.03)",
                          transition: "all 0.2s",
                          boxShadow: selectedPayment === pm.id ? `0 0 12px ${pm.accent}` : "none",
                        }}
                      >
                        <div style={{ fontSize: 18, marginBottom: 4 }}>{pm.icon}</div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "var(--text)", marginBottom: 0 }}>{pm.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lines */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                  {cart.map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.cat === 'gaming' ? '🎮' : '💎'} {item.name}</span>
                      <span style={{ fontSize: 13, color: "var(--text)", fontWeight: 600 }}>{item.eur}€</span>
                    </div>
                  ))}
<div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Livraison</span>
                    <span style={{ fontSize: 13, color: "#00ff88", fontWeight: 600 }}>Gratuite ⚡</span>
                  </div>
                  
                  {/* Promo code section */}
                  {appliedPromo ? (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 13, color: "#00ff88" }}>🎫 {appliedPromo.code}</span>
                        <button 
                          onClick={handleRemovePromo}
                          style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                          Supprimer
                        </button>
                      </div>
                      <span style={{ fontSize: 13, color: "#00ff88", fontWeight: 600 }}>-{appliedPromo.discount.toFixed(2)}€</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <input 
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Code promo"
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        disabled={promoLoading}
                        style={{ 
                          flex: 1, 
                          padding: "8px 12px", 
                          borderRadius: 8, 
                          border: promoError ? "1px solid #ef4444" : "1px solid var(--border)", 
                          background: "rgba(255,255,255,0.03)", 
                          color: "var(--text)", 
                          fontSize: 13,
                          outline: "none"
                        }}
                      />
                      <button 
                        onClick={handleApplyPromo}
                        disabled={promoLoading || !promoCode.trim()}
                        style={{ 
                          padding: "8px 16px", 
                          borderRadius: 8, 
                          border: "1px solid var(--cyan)", 
                          background: promoCode.trim() ? "rgba(0,255,224,0.1)" : "rgba(255,255,255,0.03)", 
                          color: promoCode.trim() ? "var(--cyan)" : "var(--text-muted)", 
                          fontSize: 13, 
                          fontWeight: 600,
                          cursor: promoCode.trim() && !promoLoading ? "pointer" : "not-allowed",
                          opacity: promoLoading ? 0.7 : 1
                        }}
                      >
                        {promoLoading ? "..." : "Appliquer"}
                      </button>
                    </div>
                  )}
                  {promoError && <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>{promoError}</p>}
                </div>

                {/* Total */}
                <div style={{ borderRadius: 12, border: "1px solid rgba(0,255,224,0.2)", background: "rgba(0,255,224,0.06)", padding: "14px 16px", marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>Total</span>
                    <span className="text-gradient-cyan" style={{ fontSize: 22, fontWeight: 800 }}>
                      {total}€
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "right" }}>{toFCFA(total)} FCFA</p>
                </div>

                {/* CTA */}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center", opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? (
                    <>
                      <span style={{ width: 16, height: 16, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                      Traitement…
                    </>
                  ) : (
                    <>
                      Payer {total}€
                      <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </>
                  )}
                </button>

                {/* Trust badges */}
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 14 }}>
                  {["🔐 Sécurisé", "⚡ Instantané", "✅ Officiel"].map((badge) => (
                    <span key={badge} style={{ fontSize: 11, color: "var(--text-muted)" }}>{badge}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes dotPulse {
          0%,100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(1.5); opacity: 0.6; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
          .payment-methods-grid {
            grid-template-columns: repeat(1, 1fr) !important;
          }
        }
        @media (min-width: 640px) {
          .payment-methods-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
      `}</style>
    </main>
  );
}