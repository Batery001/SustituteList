"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { EventSubmitForm } from "@/components/EventSubmitForm";
import { formatDivision, type Division } from "@/lib/division";

function formatFee(pesos: number): string {
  if (pesos <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

export function RegistrationStatusPage({
  eventSlug,
  accessToken,
}: {
  eventSlug: string;
  accessToken: string;
}) {
  const [data, setData] = useState<{
    registration: {
      playerName: string;
      popId: string;
      division: Division;
      paymentStatus: string;
    };
    event: {
      name: string;
      slug: string;
      deadlineLabel: string;
      entryFeeCents: number;
      status: string;
    };
    store: { name: string; address?: string; city?: string; phone?: string } | null;
    deckEditToken: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/registrations/${accessToken}`);
    const json = await res.json();
    if (res.ok) setData(json);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  if (!data) {
    return (
      <p className="text-center text-red-400">Inscripción no encontrada.</p>
    );
  }

  const { registration, event, store, deckEditToken } = data;
  const paid = registration.paymentStatus === "paid";
  const canSubmit =
    event.status === "open" && !deckEditToken;

  return (
    <div className="space-y-6">
      <section className="sub-panel rounded-xl p-5">
        <p className="text-xs font-semibold uppercase text-sky-400">
          Mi inscripción
        </p>
        <h2 className="mt-1 text-xl font-bold">{event.name}</h2>
        <p className="mt-2 text-sm text-sky-100/70">
          {registration.playerName} · Pop {registration.popId} ·{" "}
          {formatDivision(registration.division)}
        </p>
        <p
          className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            paid
              ? "bg-emerald-950/60 text-emerald-300"
              : "bg-amber-950/60 text-amber-300"
          }`}
        >
          {paid ? "Pago confirmado" : "Pago pendiente"}
        </p>
      </section>

      {!paid && (
        <section className="sub-panel-accent rounded-xl p-5 text-sm">
          <p className="font-semibold text-sky-50">Paga en tienda</p>
          <p className="mt-2 text-sky-100/70">
            Cuota: {formatFee(event.entryFeeCents)} en{" "}
            <strong>{store?.name ?? "la tienda"}</strong>
          </p>
          {store && (store.address || store.city) && (
            <p className="mt-2 text-sky-100/50">
              {[store.address, store.city].filter(Boolean).join(", ")}
              {store.phone ? ` · ${store.phone}` : ""}
            </p>
          )}
          <p className="mt-3 text-xs text-sky-100/40">
            Esta página se actualiza cuando el staff confirme tu pago.
          </p>
          <button
            type="button"
            onClick={load}
            className="mt-3 text-xs text-sky-400 underline"
          >
            Actualizar
          </button>
        </section>
      )}

      {paid && !deckEditToken && canSubmit && (
        <section>
          <EventSubmitForm
            eventSlug={eventSlug}
            canSubmit
            deadlineLabel={event.deadlineLabel}
            registrationAccessToken={accessToken}
            playerPreview={{
              playerName: registration.playerName,
              popId: registration.popId,
              division: registration.division,
            }}
          />
        </section>
      )}

      {deckEditToken && (
        <Link
          href={`/e/${eventSlug}/deck/${deckEditToken}`}
          className="sub-btn-primary block rounded-xl py-3 text-center text-sm"
        >
          Ver / editar mi lista
        </Link>
      )}

      <Link
        href={`/e/${eventSlug}`}
        className="block text-center text-sm text-sky-100/45 underline"
      >
        ← Volver al torneo
      </Link>
    </div>
  );
}
