"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

function formatFee(pesos: number): string {
  if (pesos <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

export function OnlinePaymentPanel({
  registrationAccessToken,
  entryFeeCents,
  storeName,
  storeAddress,
  storeCity,
  storePhone,
  onlinePaymentsAvailable,
  onlinePaymentsEnabled = true,
  onRefresh,
}: {
  registrationAccessToken: string;
  entryFeeCents: number;
  storeName: string;
  storeAddress?: string;
  storeCity?: string;
  storePhone?: string;
  /** Transbank configurado (código + API Key en tienda o Vercel). */
  onlinePaymentsAvailable: boolean;
  onlinePaymentsEnabled?: boolean;
  onRefresh?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  useEffect(() => {
    if (!onRefresh) return;
    const interval = setInterval(() => {
      onRefreshRef.current?.();
    }, 20_000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const showWebpay =
    entryFeeCents > 0 && onlinePaymentsEnabled !== false;

  async function payOnline() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/transbank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationAccessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago");
        setLoading(false);
        return;
      }
      if (data.url && data.token && formRef.current) {
        formRef.current.action = data.url;
        const input = formRef.current.querySelector(
          'input[name="token_ws"]'
        ) as HTMLInputElement;
        if (input) input.value = data.token;
        formRef.current.submit();
        return;
      }
      setError("Respuesta de pago incompleta");
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sub-panel-accent space-y-4 rounded-xl p-5 text-sm">
      <form ref={formRef} method="POST" className="hidden">
        <input type="hidden" name="token_ws" defaultValue="" />
      </form>

      <div>
        <p className="font-semibold text-sky-50">Pago de inscripción</p>
        <p className="mt-2 text-sky-100/70">
          Cuota: <strong>{formatFee(entryFeeCents)}</strong>
        </p>
      </div>

      {showWebpay && (
        <div className="space-y-2">
          <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200">
            <strong>Modo prueba.</strong> El pago usa el sandbox de Transbank.
            Tarjeta de prueba:{" "}
            <span className="font-mono">4051 8856 0044 6623</span> · CVV{" "}
            <span className="font-mono">123</span> · cualquier fecha futura.
            No se cobra dinero real.
          </p>
          {!onlinePaymentsAvailable && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-200">
              El pago online aún no está activado en esta tienda. Puedes pagar
              en local.
            </p>
          )}
          <Button
            type="button"
            onClick={payOnline}
            disabled={loading || !onlinePaymentsAvailable}
            className="w-full"
          >
            {loading
              ? "Conectando con Webpay…"
              : "Pagar con Webpay (prueba)"}
          </Button>
          <p className="text-xs text-sky-100/40">
            Ambiente de integración Transbank. Producción se habilitará más
            adelante.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="border-t border-sky-500/15 pt-4">
        <p className="font-medium text-sky-100/80">O paga en tienda</p>
        <p className="mt-1 text-sky-100/55">
          Paga en <strong>{storeName}</strong> y el staff marcará tu inscripción
          como pagada desde su panel de torneo (botón «Marcar pagado»).
        </p>
        <p className="mt-2 text-xs text-sky-100/45">
          Esta página se actualiza sola cada 20 s, o toca «Actualizar estado»
          cuando el local confirme tu pago.
        </p>
        {(storeAddress || storeCity) && (
          <p className="mt-2 text-sky-100/45">
            {[storeAddress, storeCity].filter(Boolean).join(", ")}
            {storePhone ? ` · ${storePhone}` : ""}
          </p>
        )}
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="mt-3 text-xs text-sky-400 underline"
          >
            Actualizar estado
          </button>
        )}
      </div>
    </section>
  );
}
