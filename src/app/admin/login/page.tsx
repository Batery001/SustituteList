"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      const hint = data.hint ? ` ${data.hint}` : "";
      setError(`${data.error ?? "No se pudo iniciar sesión"}${hint}`);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Administración de tienda" />
      <main className="px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Correo</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3"
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Entrando…" : "Iniciar sesión"}
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-zinc-500">
          Credenciales en .env.local (ADMIN_EMAIL / ADMIN_PASSWORD)
        </p>
      </main>
    </div>
  );
}
