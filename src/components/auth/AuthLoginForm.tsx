"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { UserRole } from "@/types/models";

function defaultDashboard(role: UserRole) {
  if (role === "STORE" || role === "ADMIN") return "/dashboard/store";
  return "/dashboard/player";
}

function AuthLoginFormInner() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const recovered = searchParams.get("recovered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Correo o contraseña incorrectos");
      return;
    }

    const sessionRes = await fetch("/api/auth/session");
    const session = (await sessionRes.json()) as {
      user?: { role: UserRole };
    };

    const destination =
      callbackUrl && callbackUrl.startsWith("/")
        ? callbackUrl
        : defaultDashboard(session.user?.role ?? "PLAYER");

    window.location.assign(destination);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {recovered && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Contraseña actualizada. Ya puedes iniciar sesión.
        </p>
      )}
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
      <p className="text-right text-xs">
        <Link href="/auth/recuperar" className="text-sky-100/45 underline hover:text-sky-300">
          ¿Olvidaste tu contraseña?
        </Link>
      </p>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Entrando…" : "Iniciar sesión"}
      </Button>
      <p className="text-center text-sm text-sky-100/45">
        ¿No tienes cuenta?{" "}
        <Link href="/auth/register" className="sub-link underline">
          Regístrate
        </Link>
      </p>
    </form>
  );
}

export function AuthLoginForm() {
  return (
    <Suspense fallback={<p className="text-sky-100/50">Cargando…</p>}>
      <AuthLoginFormInner />
    </Suspense>
  );
}
