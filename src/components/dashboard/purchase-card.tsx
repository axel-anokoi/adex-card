"use client";

import { useState } from "react";

interface GiftCode {
  code: string;
  expires_at: string | null;
}

interface PurchaseItem {
  id: string;
  product: {
    id: string;
    amount: number;
    category: { name: string } | null;
  };
  gift_code: GiftCode | null;
  quantity: number;
  unit_price: number;
}

interface Purchase {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  purchase_items: PurchaseItem[];
}

interface PurchaseCardProps {
  purchase: Purchase;
  onRefundRequest?: (purchaseId: string) => void;
}

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:              { label: "En attente",  bg: "rgba(217,119,6,0.12)",   color: "var(--amber)" },
  paid:                 { label: "Payé",         bg: "rgba(5,150,105,0.12)",   color: "var(--green)" },
  failed:               { label: "Échoué",       bg: "rgba(220,38,38,0.12)",   color: "#ef4444" },
  refunded:             { label: "Remboursé",    bg: "rgba(100,116,139,0.12)", color: "var(--text-muted)" },
  pending_manual_review:{ label: "Vérification", bg: "var(--violet-dim)",      color: "var(--violet)" },
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const el = document.createElement("textarea");
        el.value = text;
        el.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0";
        document.body.appendChild(el);
        el.focus();
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silent fail — user can select manually
    }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        border: "1px solid var(--border-cyan)",
        color: copied ? "var(--green)" : "var(--cyan)",
        background: copied ? "rgba(0,255,136,0.08)" : "var(--cyan-dim)",
        borderColor: copied ? "var(--green)" : undefined,
        transition: "all 0.2s",
      }}
      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold min-h-[36px] touch-manipulation"
    >
      {copied ? "Copié !" : "Copier"}
    </button>
  );
}

export function PurchaseCard({ purchase, onRefundRequest }: PurchaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusConfig[purchase.status] ?? {
    label: purchase.status,
    bg: "var(--bg2)",
    color: "var(--text-muted)",
  };

  const totalItems = purchase.purchase_items.reduce((sum, item) => sum + item.quantity, 0);
  const shortDate = new Date(purchase.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
  const time = new Date(purchase.created_at).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        transition: "border-color 0.2s",
      }}
      className="rounded-xl p-4 hover:border-[var(--border-hover)]"
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--border-hover)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-start justify-between gap-2 min-h-[44px]"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-base truncate" style={{ color: "var(--text)" }}>
            {shortDate}
            <span className="text-xs ml-1" style={{ color: "var(--text-faint)" }}>{time}</span>
          </p>
          <p className="text-xs sm:text-sm" style={{ color: "var(--text-muted)" }}>
            {totalItems} article{totalItems > 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <p className="font-bold text-sm sm:text-base" style={{ color: "var(--text)" }}>
            {purchase.total_amount.toLocaleString("fr-FR")}
            <span className="text-xs font-normal ml-0.5" style={{ color: "var(--text-muted)" }}>FCFA</span>
          </p>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Chevron indicator */}
      <div className="flex justify-center mt-1">
        <svg
          className="w-4 h-4 transition-transform"
          style={{ color: "var(--text-faint)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="space-y-3">
            {purchase.purchase_items.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-3 text-sm"
                style={{ background: "var(--bg2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {item.product.category && (
                      <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                        style={{ color: "var(--text-faint)" }}>
                        {item.product.category.name}
                      </p>
                    )}
                    <p className="font-bold" style={{ color: "var(--text)" }}>
                      {item.product.amount.toLocaleString("fr-FR")} FCFA
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Qté : {item.quantity} &middot; {(item.unit_price * item.quantity).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>
                </div>

                {item.gift_code && (
                  <div
                    className="mt-3 rounded-md p-3"
                    style={{
                      border: "1px dashed var(--border-cyan)",
                      background: "var(--cyan-dim)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs shrink-0" style={{ color: "var(--text-faint)" }}>Code :</span>
                      <span
                        className="font-mono font-bold tracking-widest break-all flex-1 text-sm"
                        style={{ color: "var(--cyan)" }}
                      >
                        {item.gift_code.code}
                      </span>
                      <CopyButton text={item.gift_code.code} />
                    </div>
                    {item.gift_code.expires_at && (
                      <p className="mt-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
                        Expire le {new Date(item.gift_code.expires_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {purchase.status === "paid" && onRefundRequest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefundRequest(purchase.id);
              }}
              className="mt-4 w-full min-h-[48px] rounded-xl px-4 py-3 text-sm font-medium touch-manipulation transition-colors"
              style={{
                border: "1px solid rgba(220,38,38,0.3)",
                background: "rgba(220,38,38,0.08)",
                color: "#ef4444",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.14)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(220,38,38,0.08)")}
            >
              Demander un remboursement
            </button>
          )}
        </div>
      )}
    </div>
  );
}
