export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-6 rounded-xl border border-black/10 bg-white p-6">
        <p className="text-black/70">
          Cette page servira de pont vers Stripe Checkout. Utilise l’endpoint <code>/api/checkout</code>.
        </p>
      </div>
    </div>
  );
}
