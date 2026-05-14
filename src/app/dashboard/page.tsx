"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NotificationPanel } from "@/components/dashboard/notification-panel";
import { PurchaseCard } from "@/components/dashboard/purchase-card";

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

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const response = await fetch("/api/user/purchases");

        if (response.status === 401) {
          router.push("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch purchases");
        }

        const { data } = await response.json();
        setPurchases(data || []);

        const total = data?.reduce((sum: number, p: Purchase) => sum + p.total_amount, 0) || 0;
        setTotalSpent(total);
      } catch (error) {
        console.error("Failed to fetch purchases:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, [router]);

  const handleRefundRequest = async () => {
    if (!selectedPurchase || !refundReason.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/user/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchase_id: selectedPurchase,
          reason: refundReason,
        }),
      });

      if (response.ok) {
        alert("Demande de remboursement envoyée");
        setShowRefundModal(false);
        setRefundReason("");
        setSelectedPurchase(null);
      } else {
        const error = await response.json();
        alert(error.error || "Erreur lors de la soumission");
      }
    } catch (error) {
      console.error("Refund request failed:", error);
      alert("Erreur lors de la soumission");
    } finally {
      setSubmitting(false);
    }
  };

  const openRefundModal = (purchaseId: string) => {
    setSelectedPurchase(purchaseId);
    setShowRefundModal(true);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center">
        <p className="text-black/60">Chargement...</p>
      </div>
    );
  }

  const totalCodeCount = purchases.reduce(
    (sum, p) => sum + p.purchase_items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10" style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <h1 className="text-3xl font-bold">Mon Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Commandes</p>
          <p className="text-2xl font-bold">{purchases.length}</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Total dépensé</p>
          <p className="text-2xl font-bold">{totalSpent.toFixed(2)}€</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Codes livrés</p>
          <p className="text-2xl font-bold">{totalCodeCount}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Purchase History */}
        <div>
          <h2 className="text-2xl font-bold">Historique des commandes</h2>
          {purchases.length === 0 ? (
            <div className="mt-4 rounded-xl border border-black/10 bg-white p-6 text-center text-black/60">
              <p>Aucune commande pour le moment.</p>
              <Link href="/shop" className="mt-4 inline-block text-cyan-600 hover:underline">
                Commencer à acheter
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {purchases.map((purchase) => (
                <PurchaseCard
                  key={purchase.id}
                  purchase={purchase}
                  onRefundRequest={openRefundModal}
                />
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div>
          <NotificationPanel />
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold">Demander un remboursement</h3>
            <p className="mt-2 text-sm text-black/60">
              Veuillez expliquez la raison de votre demande de remboursement.
            </p>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Décrivez votre problème..."
              className="mt-4 w-full rounded-lg border border-black/20 p-3 text-sm"
              rows={4}
            />
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason("");
                  setSelectedPurchase(null);
                }}
                className="flex-1 rounded-lg border border-black/20 px-4 py-2"
              >
                Annuler
              </button>
              <button
                onClick={handleRefundRequest}
                disabled={submitting || !refundReason.trim()}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white disabled:opacity-50"
              >
                {submitting ? "Envoi..." : "Envoyer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
