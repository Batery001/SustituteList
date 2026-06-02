"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageShell } from "@/components/PageShell";
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
      const detail = data.detail ? ` Detalle: ${data.detail}` : "";
      setError(`${data.error ?? "No se pudo iniciar sesión"}${hint}${detail}`);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <PageShell subtitle="Acceso tienda" area="public">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-sky-100/55">
          Entras al <strong className="text-rose-300/90">modo tienda</strong>{" "}
          (torneos, inscripciones, Webpay). ¿Eres jugador?{" "}
          <Link href="/jugador/login" className="sub-link underline">
            Inicia sesión aquí
          </Link>
          .
        </p>
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">Correo</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sub-input w-full px-3 py-3"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Contraseña
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="sub-input w-full px-3 py-3"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Entrando…" : "Entrar al panel de tienda"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-sky-100/45">
        <Link href="/" className="underline">
          ← Volver al inicio
        </Link>
      </p>
    </PageShell>
  );
}
