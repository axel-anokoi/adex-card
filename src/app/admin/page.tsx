export default function AdminPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold">Dashboard administrateur</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Ventes aujourd’hui</p>
          <p className="text-xl font-bold">0.00€</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Ventes du mois</p>
          <p className="text-xl font-bold">0.00€</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Bénéfice net</p>
          <p className="text-xl font-bold">0.00€</p>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm text-black/60">Alertes stock faible</p>
          <p className="text-xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
}
