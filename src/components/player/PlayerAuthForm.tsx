"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDivision, getDivision } from "@/lib/division";

type Mode = "login" | "register";

export function PlayerAuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard/player";
  const isLogin = mode === "login";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [popId, setPopId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const division =
    mode === "register" && birthDate && !Number.isNaN(new Date(birthDate).getTime())
      ? getDivision(new Date(birthDate))
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const url =
      mode === "login"
        ? "/api/auth/player/login"
        : "/api/auth/player/register";

    const body =
      mode === "login"
        ? { email, password }
        : { email, password, playerName, popId, birthDate };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isLogin && (
        <p className="text-sm text-sky-100/55">
          Cuenta de jugador (Pop ID, mazos, inscripciones). Si ya tienes cuenta,{" "}
          <a href="/login" className="sub-link underline">
            inicia sesión
          </a>
          .
        </p>
      )}
      {mode === "register" && (
        <>
          <div>
            <label className="mb-1 block text-sm text-sky-200/80">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="sub-input w-full px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-sky-200/80">Pop ID</label>
            <input
              type="text"
              required
              value={popId}
              onChange={(e) => setPopId(e.target.value)}
              className="sub-input w-full px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-sky-200/80">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="sub-input w-full px-3 py-3"
            />
            {division && (
              <p className="mt-1 text-sm text-sky-400">
                División: {formatDivision(division)}
              </p>
            )}
          </div>
        </>
      )}
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
        <label className="mb-1 block text-sm text-sky-200/80">Contraseña</label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading
          ? "…"
          : mode === "login"
            ? "Iniciar sesión"
            : "Crear cuenta"}
      </Button>
    </form>
  );
}
