"use client";

import { useState } from "react";
import { clearEventRegistrationToken } from "@/lib/event-registration-storage";

export function CancelAttendanceButton({
  accessToken,
  eventSlug,
  onCancelled,
}: {
  accessToken: string;
  eventSlug: string;
  onCancelled: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    const ok = window.confirm(
      "¿Cancelar tu asistencia? Se eliminará tu inscripción y tu lista de este torneo."
    );
    if (!ok) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${accessToken}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo cancelar la asistencia");
        return;
      }
      clearEventRegistrationToken(eventSlug);
      onCancelled();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-2 text-center">
      {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
      <button
        type="button"
        onClick={() => void cancel()}
        disabled={loading}
        className="text-sm text-rose-300/80 underline decoration-rose-300/40 hover:text-rose-200 disabled:opacity-50"
      >
        {loading ? "Cancelando…" : "Cancelar asistencia"}
      </button>
    </div>
  );
}
