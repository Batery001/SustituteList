"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OnlinePaymentPanel({
  registrationAccessToken,
  confirmed = false,
  onConfirmed,
}: {
  registrationAccessToken: string;
  confirmed?: boolean;
  onConfirmed?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(confirmed);

  async function confirmAttendance() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${registrationAccessToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm-attendance" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo confirmar la asistencia");
        return;
      }
      setDone(true);
      onConfirmed?.();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <section className="sub-panel-accent space-y-2 rounded-xl p-5 text-sm">
        <p className="font-semibold text-emerald-300">Asistencia confirmada</p>
        <p className="text-sky-100/60">
          Ya quedaste apuntado al torneo. El pago se hace de forma externa.
        </p>
      </section>
    );
  }

  return (
    <section className="sub-panel-accent space-y-4 rounded-xl p-5 text-sm">
      <div>
        <p className="font-semibold text-sky-50">Confirmar asistencia</p>
        <p className="mt-2 text-sky-100/70">
          El pago se hace fuera de esta página (en tienda u otro medio). Confirma
          que vas a participar.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="button"
        onClick={confirmAttendance}
        disabled={loading}
        className="w-full"
      >
        {loading ? "Confirmando…" : "Confirmar asistencia"}
      </Button>
    </section>
  );
}
