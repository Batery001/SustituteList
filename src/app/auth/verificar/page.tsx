"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/Button";

function VerificarCorreoInner() {
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Confirmando tu correo…");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el enlace de verificación.");
      return;
    }
    void (async () => {
      const res = await fetch("/api/auth/verify-email", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "No se pudo verificar el correo.");
        return;
      }
      setStatus("ok");
      setMessage("Correo verificado. Ya puedes seguir usando tu cuenta sin el aviso.");
    })();
  }, [token]);

  return (
    <div className="space-y-4">
      <p
        className={`rounded-lg border p-4 text-sm ${
          status === "ok"
            ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-100"
            : status === "error"
              ? "border-red-800 bg-red-950/50 text-red-200"
              : "border-sky-500/20 text-sky-100/70"
        }`}
      >
        {message}
      </p>
      <Link href="/auth/login">
        <Button type="button" className="w-full">
          Ir al inicio de sesión
        </Button>
      </Link>
    </div>
  );
}

export default function VerificarCorreoPage() {
  return (
    <PageShell subtitle="Verificar correo" area="public">
      <h1 className="mb-4 text-lg font-semibold text-sky-50">Verificar correo</h1>
      <Suspense fallback={<p className="text-sm text-sky-100/50">Cargando…</p>}>
        <VerificarCorreoInner />
      </Suspense>
    </PageShell>
  );
}
