import Link from "next/link";

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Panier</h1>
      <div className="mt-6 rounded-xl border border-black/10 bg-white p-6">
        <p className="text-black/70">Votre panier est prêt pour l’intégration dynamique.</p>
        <div className="mt-4 border-t border-black/10 pt-4 text-sm">
          <p>Sous-total: 19.90€</p>
          <p>Frais: 0.00€</p>
          <p className="font-semibold">Total: 19.90€</p>
        </div>
        <Link
          href="/checkout"
          className="mt-6 inline-flex rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
        >
          Passer au paiement
        </Link>
      </div>
    </div>
  );
}
