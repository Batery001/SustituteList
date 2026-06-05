"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatDivision, type Division } from "@/lib/division";
import {
  eventTypeLabel,
  formatEventDate,
  formatPriceCLP,
  statusBadgeClass,
} from "@/lib/events/store-event-utils";
import type { StoreEventSummary } from "@/types/store-dashboard";

type RegistrationRow = {
  _id: string;
  playerName: string;
  popId: string;
  division: Division;
  paymentStatus: string;
  hasDecklist: boolean;
};

const DIVISIONS: Division[] = ["master", "senior", "junior"];

export function EventRegistrationsPanel({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<StoreEventSummary | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tab, setTab] = useState<Division>("master");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [evRes, regRes] = await Promise.all([
      fetch(`/api/events/store/${eventId}`),
      fetch(`/api/registrations?eventId=${eventId}`),
    ]);

    const evData = (await evRes.json()) as {
      event?: StoreEventSummary;
      error?: string;
    };
    const regData = (await regRes.json()) as {
      registrations?: RegistrationRow[];
      error?: string;
    };

    if (!evRes.ok) {
      setError(evData.error ?? "Torneo no encontrado");
      return;
    }

    if (!regRes.ok) {
      setError(regData.error ?? "No se pudieron cargar inscripciones");
      return;
    }

    setEvent(evData.event ?? null);
    setRegistrations(regData.registrations ?? []);
    setError(null);
  }, [eventId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const byDivision = (d: Division) =>
    registrations.filter((r) => r.division === d);

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  if (error || !event) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-400">{error ?? "Torneo no encontrado"}</p>
        <Link href="/dashboard/store" className="sub-link text-sm underline">
          ← Volver al panel
        </Link>
      </div>
    );
  }

  const spots =
    event.maxPlayers != null && event.maxPlayers > 0
      ? `${event.registrationCount}/${event.maxPlayers}`
      : String(event.registrationCount);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/store"
          className="text-xs text-sky-100/45 underline hover:text-sky-300"
        >
          ← Torneos
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-sky-50">{event.title}</h1>
            <p className="mt-1 text-sm text-sky-100/55">
              {eventTypeLabel(event.type)} · {formatPriceCLP(event.price)} ·{" "}
              {formatEventDate(event.date)}
            </p>
            <p className="mt-1 text-xs text-sky-100/45">
              Decklist hasta: {formatEventDate(event.decklistDeadline)}
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(event.status)}`}
          >
            {event.status}
          </span>
        </div>
        <p className="mt-2 text-sm text-sky-200/80">
          Inscritos: <strong>{spots}</strong>
        </p>
        <Link
          href={`/e/${event.slug}`}
          className="mt-2 inline-block text-xs text-sky-400 underline"
        >
          Ver página pública del torneo →
        </Link>
      </div>

      <div className="flex gap-1 border-b border-sky-500/15 pb-2">
        {DIVISIONS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setTab(d)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tab === d
                ? "bg-sky-500/20 text-sky-100"
                : "text-sky-100/45 hover:text-sky-100"
            }`}
          >
            {formatDivision(d)} ({byDivision(d).length})
          </button>
        ))}
      </div>

      <section>
        {byDivision(tab).length === 0 ? (
          <p className="text-sm text-sky-100/50">
            Sin inscritos en {formatDivision(tab)}.
          </p>
        ) : (
          <ul className="divide-y divide-sky-500/15 rounded-xl border border-sky-500/20">
            {byDivision(tab).map((r) => (
              <li
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sky-50">{r.playerName}</p>
                  <p className="text-xs text-sky-100/50">Pop ID {r.popId}</p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={
                      r.paymentStatus === "paid"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }
                  >
                    {r.paymentStatus === "paid" ? "Pagado" : "Pago pendiente"}
                  </span>
                  {r.hasDecklist ? (
                    <span className="text-emerald-300">✅ Lista recibida</span>
                  ) : (
                    <span className="text-amber-300">⚠️ Sin lista</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          setLoading(true);
          load().finally(() => setLoading(false));
        }}
        className="text-sm text-sky-400 underline"
      >
        Actualizar inscritos
      </button>
    </div>
  );
}
