import Link from "next/link";
import { notFound } from "next/navigation";

interface ProductDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/products/${slug}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const { data } = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-sm text-black/60">{product.category?.name || "Produit"}</p>
        <h1 className="mt-1 text-3xl font-bold">{product.amount}€</h1>
        <p className="mt-4 text-black/70">
          Livraison immédiate par email après confirmation du paiement.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-black/60">Montant</p>
            <p className="text-lg font-semibold">{product.amount}€</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-black/60">Prix</p>
            <p className="text-lg font-semibold">{product.sell_price.toFixed(2)}€</p>
          </div>
          <div className="rounded-lg bg-zinc-50 p-3">
            <p className="text-xs text-black/60">Stock</p>
            <p className="text-lg font-semibold">
              {product.stock_available > 0 ? `${product.stock_available} codes` : "Rupture"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            href="/cart"
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/85"
          >
            Ajouter au panier
          </Link>
          <Link
            href="/checkout"
            className="rounded-md border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5"
          >
            Acheter maintenant
          </Link>
        </div>
      </div>
    </div>
  );
}
