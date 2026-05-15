"use client";

import { useState } from "react";
import Link from "next/link";

interface PurchaseItem {
  id: string;
  product: {
    id: string;
    amount: number;
    category_id: string;
  };
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

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "En attente", color: "text-amber-600 bg-amber-100" },
  paid: { label: "Payé", color: "text-emerald-600 bg-emerald-100" },
  failed: { label: "Échoué", color: "text-red-600 bg-red-100" },
  refunded: { label: "Remboursé", color: "text-gray-600 bg-gray-100" },
  pending_manual_review: { label: "Vérification", color: "text-purple-600 bg-purple-100" },
};

export function PurchaseCard({ purchase, onRefundRequest }: PurchaseCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const status = statusLabels[purchase.status] || { label: purchase.status, color: "text-gray-600 bg-gray-100" };

  const totalItems = purchase.purchase_items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="rounded-xl border border-black/10 bg-white p-4 transition-colors hover:border-black/20">
      <div
        className="flex cursor-pointer items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <p className="font-medium">
            {new Date(purchase.created_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-sm text-black/60">{totalItems} article(s)</p>
        </div>
        <div className="text-right">
          <p className="font-bold">{purchase.total_amount.toFixed(2)} FCFA</p>
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 animate-fade-up border-t border-black/10 pt-4">
          <div className="space-y-2">
            {purchase.purchase_items.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{item.product.amount} FCFA</p>
                  <p className="text-black/60">Qté: {item.quantity}</p>
                </div>
                <p className="font-medium">{(item.unit_price * item.quantity).toFixed(2)} FCFA</p>
              </div>
            ))}
          </div>

          {purchase.status === "paid" && onRefundRequest && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRefundRequest(purchase.id);
              }}
              className="mt-4 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              Demander un remboursement
            </button>
          )}
        </div>
      )}
    </div>
  );
}
