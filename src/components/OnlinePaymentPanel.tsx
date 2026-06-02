"use client";

import { useState } from "react";
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
  onRefresh,
}: {
  registrationAccessToken: string;
  entryFeeCents: number;
  storeName: string;
  storeAddress?: string;
  storeCity?: string;
  storePhone?: string;
  onlinePaymentsAvailable: boolean;
  onRefresh?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function payOnline() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationAccessToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar el pago");
        return;
      }
      if (data.initPoint) {
        window.location.href = data.initPoint;
      }
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="sub-panel-accent space-y-4 rounded-xl p-5 text-sm">
      <div>
        <p className="font-semibold text-sky-50">Pago de inscripción</p>
        <p className="mt-2 text-sky-100/70">
          Cuota: <strong>{formatFee(entryFeeCents)}</strong>
        </p>
      </div>

      {onlinePaymentsAvailable && (
        <div className="space-y-2">
          <Button
            type="button"
            onClick={payOnline}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Redirigiendo…" : "Pagar online con Mercado Pago"}
          </Button>
          <p className="text-xs text-sky-100/40">
            Tarjeta, débito o cuenta Mercado Pago. Al aprobarse, podrás enviar tu
            lista al instante.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="border-t border-sky-500/15 pt-4">
        <p className="font-medium text-sky-100/80">O paga en tienda</p>
        <p className="mt-1 text-sky-100/55">
          En <strong>{storeName}</strong> el staff confirmará tu pago manualmente.
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
