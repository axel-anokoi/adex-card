"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md px-4 py-24">
      <h1 className="text-3xl font-bold text-white">Connexion</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-white/10 bg-zinc-900 p-6">
        {error && <div className="rounded-lg bg-red-500/20 p-3 text-sm text-red-400">{error}</div>}

        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white outline-none ring-0 focus:border-white/50"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white/70">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-white outline-none ring-0 focus:border-white/50"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black hover:bg-white/90 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-white/60">
        Pas de compte ?{" "}
        <Link href="/register" className="font-medium text-white hover:underline">
          S&#39;inscrire
        </Link>
      </p>
    </div>
  );
}
