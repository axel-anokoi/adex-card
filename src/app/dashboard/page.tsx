"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Purchase {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  purchase_items: Array<{
    product: { amount: number; category_id: string };
    quantity: number;
  }>;
}

export default function DashboardPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
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

  if (loading) {
    return <div className="mx-auto w-full max-w-5xl px-4 py-10 text-center">Chargement...</div>;
  }

  const totalCodeCount = purchases.reduce(
    (sum, p) => sum + p.purchase_items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold">Dashboard client</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
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

      <h2 className="mt-8 text-2xl font-bold">Historique des commandes</h2>
      {purchases.length === 0 ? (
        <div className="mt-4 rounded-xl border border-black/10 bg-white p-6 text-center text-black/60">
          <p>Aucune commande pour le moment.</p>
          <Link href="/shop" className="mt-4 inline-block text-blue-600 hover:underline">
            Commencer à acheter
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {purchases.map((purchase) => (
            <Link
              key={purchase.id}
              href={`/dashboard/purchase/${purchase.id}`}
              className="rounded-xl border border-black/10 bg-white p-4 hover:border-black/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{new Date(purchase.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-black/60">
                    {purchase.purchase_items.length} article(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{purchase.total_amount.toFixed(2)}€</p>
                  <p
                    className={`text-sm ${
                      purchase.status === "paid"
                        ? "text-emerald-600"
                        : purchase.status === "pending"
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {purchase.status === "paid"
                      ? "Payé"
                      : purchase.status === "pending"
                        ? "En attente"
                        : "Échoué"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
