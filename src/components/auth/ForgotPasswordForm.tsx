"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type AccountType = "PLAYER" | "STORE";
type Step = "verify" | "reset";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("verify");
  const [accountType, setAccountType] = useState<AccountType>("PLAYER");
  const [email, setEmail] = useState("");
  const [popId, setPopId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [storeName, setStoreName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload =
      accountType === "PLAYER"
        ? { accountType, email, popId, birthDate }
        : { accountType, email, storeName };

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as { error?: string; resetToken?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo verificar la cuenta");
      return;
    }

    setResetToken(data.resetToken ?? "");
    setStep("reset");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetToken, password, passwordConfirm }),
    });

    const data = (await res.json()) as { error?: string };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo guardar la contraseña");
      return;
    }

    router.push("/auth/login?recovered=1");
    router.refresh();
  }

  if (step === "reset") {
    return (
      <form onSubmit={handleReset} className="space-y-4">
        <p className="text-sm text-sky-100/55">
          Identidad verificada. Elige una contraseña nueva para{" "}
          <strong className="text-sky-200">{email}</strong>.
        </p>
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Nueva contraseña
          </label>
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
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Confirmar contraseña
          </label>
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            className="sub-input w-full px-3 py-3"
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando…" : "Guardar contraseña"}
        </Button>
        <button
          type="button"
          onClick={() => {
            setStep("verify");
            setResetToken("");
            setPassword("");
            setPasswordConfirm("");
          }}
          className="w-full text-sm text-sky-100/45 hover:text-sky-200"
        >
          ← Volver a verificar
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerify} className="space-y-4">
      <p className="text-sm text-sky-100/55">
        Verificamos tu identidad con los datos del registro. No enviamos correos.
      </p>

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
          Jugador
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
          Tienda
        </button>
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
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Nombre de la tienda
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="sub-input w-full px-3 py-3"
          />
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Verificando…" : "Continuar"}
      </Button>

      <p className="text-center text-sm text-sky-100/45">
        <Link href="/auth/login" className="sub-link underline">
          ← Volver al login
        </Link>
      </p>
    </form>
  );
}
