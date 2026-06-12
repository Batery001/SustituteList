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
import { DownloadDeckPdfButton } from "@/components/deck/DownloadDeckPdfButton";
import { Button } from "@/components/ui/Button";
import type { StoreEventSummary } from "@/types/store-dashboard";

type RegistrationRow = {
  _id: string;
  playerName: string;
  popId: string;
  division: Division;
  paymentStatus: string;
  hasDecklist: boolean;
  deckEditToken?: string | null;
};

const DIVISIONS: Division[] = ["master", "senior", "junior"];

export function EventRegistrationsPanel({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<StoreEventSummary | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tab, setTab] = useState<Division>("master");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

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
    let cancelled = false;
    (async () => {
      const [evRes, regRes] = await Promise.all([
        fetch(`/api/events/store/${eventId}`),
        fetch(`/api/registrations?eventId=${eventId}`),
      ]);
      if (cancelled) return;

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
        setLoading(false);
        return;
      }

      if (!regRes.ok) {
        setError(regData.error ?? "No se pudieron cargar inscripciones");
        setLoading(false);
        return;
      }

      setEvent(evData.event ?? null);
      setRegistrations(regData.registrations ?? []);
      setError(null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  async function copyEventLink() {
    if (!event) return;
    const url = `${window.location.origin}/e/${event.slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function markPaid(registrationId: string) {
    setMarkingId(registrationId);
    try {
      const res = await fetch(`/api/registrations/${registrationId}/pay`, {
        method: "POST",
      });
      if (res.ok) await load();
    } finally {
      setMarkingId(null);
    }
  }

  const byDivision = (d: Division) =>
    registrations.filter((r) => r.division === d);

  const withDeck = registrations.filter((r) => r.hasDecklist).length;
  const pendingPay = registrations.filter(
    (r) => r.paymentStatus !== "paid"
  ).length;
  const missingDeck = registrations.filter(
    (r) => r.paymentStatus === "paid" && !r.hasDecklist
  ).length;

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
              Listas hasta: {formatEventDate(event.decklistDeadline)}
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(event.status)}`}
          >
            {event.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="sub-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-sky-50">{spots}</p>
          <p className="text-xs text-sky-100/45">Inscritos</p>
        </div>
        <div className="sub-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-emerald-300">{withDeck}</p>
          <p className="text-xs text-sky-100/45">Con lista</p>
        </div>
        <div className="sub-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-300">{missingDeck}</p>
          <p className="text-xs text-sky-100/45">Falta lista</p>
        </div>
        <div className="sub-panel rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-amber-200">{pendingPay}</p>
          <p className="text-xs text-sky-100/45">Pago pendiente</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" className="text-sm" onClick={copyEventLink}>
          {copied ? "¡Link copiado!" : "Copiar link para jugadores"}
        </Button>
        <Link
          href={`/e/${event.slug}`}
          target="_blank"
          className="rounded-lg border border-sky-500/25 px-4 py-2 text-sm text-sky-200"
        >
          Ver como jugador
        </Link>
      </div>

      <p className="text-xs text-sky-100/45">
        Comparte el link con tus jugadores. Ahí se inscriben, pagan (si aplica) y
        suben su lista de 60 cartas en un solo lugar.
      </p>

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
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sky-50">{r.playerName}</p>
                  <p className="text-xs text-sky-100/50">Pop ID {r.popId}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {r.paymentStatus === "paid" ? (
                    <span className="text-emerald-400">Pagado</span>
                  ) : (
                    <>
                      <span className="text-amber-400">Pago pendiente</span>
                      <button
                        type="button"
                        disabled={markingId === r._id}
                        onClick={() => markPaid(r._id)}
                        className="rounded-md bg-emerald-500/15 px-2 py-1 text-emerald-300 hover:bg-emerald-500/25"
                      >
                        {markingId === r._id ? "…" : "Marcar pagado"}
                      </button>
                    </>
                  )}
                  {r.hasDecklist ? (
                    <>
                      <span className="text-emerald-300">Lista ✓</span>
                      {r.deckEditToken && (
                        <DownloadDeckPdfButton
                          token={r.deckEditToken}
                          className="px-2 py-1 text-xs"
                        />
                      )}
                    </>
                  ) : (
                    <span className="text-amber-300">Sin lista</span>
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
        Actualizar
      </button>
    </div>
  );
}
