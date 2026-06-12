"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { EventSubmitForm } from "@/components/EventSubmitForm";
import { OnlinePaymentPanel } from "@/components/OnlinePaymentPanel";
import { formatDivision, type Division } from "@/lib/division";
import { isEventOpen } from "@/lib/events/event-status";

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
    onlinePaymentsAvailable: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const paymentNotice = useMemo(() => {
    const q = searchParams.get("payment");
    if (q === "success") {
      return "Pago recibido. Si no ves el cambio, pulsa Actualizar.";
    }
    if (q === "pending") return "Pago pendiente de confirmación.";
    if (q === "failure") {
      return "El pago no se completó. Puedes intentar de nuevo.";
    }
    if (q === "error") {
      return "Hubo un error al confirmar el pago. Contacta a la tienda.";
    }
    return null;
  }, [searchParams]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/registrations/${accessToken}`);
    const json = await res.json();
    if (res.ok) setData(json);
    setLoading(false);
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      const res = await fetch(`/api/registrations/${accessToken}`);
      const json = await res.json();
      if (cancelled) return;
      if (res.ok) setData(json);
      setLoading(false);
    };
    void fetchData();
    const t = setInterval(() => {
      void (async () => {
        const res = await fetch(`/api/registrations/${accessToken}`);
        const json = await res.json();
        if (!cancelled && res.ok) setData(json);
      })();
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [accessToken]);

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
  const canSubmit = isEventOpen(event.status) && !deckEditToken;

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

      {paymentNotice && (
        <p className="rounded-lg border border-sky-500/30 bg-sky-950/40 p-3 text-sm text-sky-200">
          {paymentNotice}
        </p>
      )}

      {!paid && event.entryFeeCents > 0 && (
        <OnlinePaymentPanel
          registrationAccessToken={accessToken}
          entryFeeCents={event.entryFeeCents}
          storeName={store?.name ?? "la tienda"}
          storeAddress={store?.address}
          storeCity={store?.city}
          storePhone={store?.phone}
          onlinePaymentsAvailable={data.onlinePaymentsAvailable}
          onRefresh={load}
        />
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
