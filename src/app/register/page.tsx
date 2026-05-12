"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Registration failed");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-10">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h1 className="text-2xl font-bold text-emerald-800">Inscription réussie</h1>
          <p className="mt-2 text-emerald-700">
            Vérifiez votre email pour confirmer votre compte. Redirection en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">Inscription</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-black/10 bg-white p-6">
        {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 outline-none ring-0 focus:border-black/50"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 outline-none ring-0 focus:border-black/50"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Confirmer le mot de passe</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-black/20 px-3 py-2 outline-none ring-0 focus:border-black/50"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black px-4 py-2 font-medium text-white hover:bg-black/85 disabled:opacity-50"
        >
          {loading ? "Création..." : "Créer le compte"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-black/70">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
