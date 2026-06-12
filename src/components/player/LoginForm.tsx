"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

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
      setError(data.error ?? "Correo o contraseña incorrectos");
      return;
    }

    const destination =
      next && next.startsWith("/") ? next : (data.redirect as string);
    router.push(destination);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-sky-100/55">
        Un solo acceso: si eres <strong className="text-rose-300/90">tienda</strong>{" "}
        irás al panel; si eres <strong className="text-sky-300">jugador</strong>, a
        tu cuenta.
      </p>
      <div>
        <label className="mb-1 block text-sm text-sky-200/80">Correo</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-sky-200/80">Contraseña</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-sky-100/45">
        ¿Eres jugador y no tienes cuenta?{" "}
        <Link href="/auth/register" className="sub-link underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<p className="text-sky-100/50">Cargando…</p>}>
      <LoginFormInner />
    </Suspense>
  );
}
