"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type AccountType = "PLAYER" | "STORE";

export function AuthRegisterForm() {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>("PLAYER");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [popId, setPopId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Chile");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload =
      accountType === "PLAYER"
        ? {
            role: "PLAYER" as const,
            name,
            email,
            password,
            popId,
            birthDate,
          }
        : {
            role: "STORE" as const,
            name,
            email,
            password,
            city,
            country,
          };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as {
      error?: string;
      redirect?: string;
    };

    if (!res.ok) {
      setLoading(false);
      setError(data.error ?? "No se pudo crear la cuenta");
      return;
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      router.push("/auth/login");
      return;
    }

    router.push(data.redirect ?? "/");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAccountType("PLAYER")}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            accountType === "PLAYER"
              ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
              : "border-sky-500/15 text-sky-100/50 hover:border-sky-400/30"
          }`}
        >
          Soy Jugador
        </button>
        <button
          type="button"
          onClick={() => setAccountType("STORE")}
          className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
            accountType === "STORE"
              ? "border-rose-400/40 bg-rose-500/10 text-sky-100"
              : "border-sky-500/15 text-sky-100/50 hover:border-sky-400/30"
          }`}
        >
          Soy Tienda
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm text-sky-200/80">
          {accountType === "PLAYER" ? "Nombre completo" : "Nombre de la tienda"}
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>

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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>

      {accountType === "PLAYER" ? (
        <>
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
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="mb-1 block text-sm text-sky-200/80">Ciudad</label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="sub-input w-full px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-sky-200/80">País</label>
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="sub-input w-full px-3 py-3"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-sky-100/45">
        ¿Ya tienes cuenta?{" "}
        <Link href="/auth/login" className="sub-link underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
