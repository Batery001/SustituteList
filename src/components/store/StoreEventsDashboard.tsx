"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreEventCard } from "@/components/store/StoreEventCard";
import type { StoreEventSummary } from "@/types/store-dashboard";

export function StoreEventsDashboard({ storeName }: { storeName: string }) {
  const [events, setEvents] = useState<StoreEventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/events/store")
      .then((r) => r.json())
      .then((data: { events?: StoreEventSummary[]; error?: string }) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setEvents(data.events ?? []);
      })
      .catch(() => setError("No se pudieron cargar los torneos"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative space-y-6 pb-20">
      <div>
        <h1 className="text-lg font-semibold text-sky-50">Panel de tienda</h1>
        <p className="mt-1 text-sm text-sky-100/55">
          Hola, <strong className="text-sky-200">{storeName}</strong>. Gestiona
          tus torneos e inscripciones.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href="/admin/perfil"
          className="rounded-lg border border-sky-500/20 px-3 py-1.5 text-sky-200"
        >
          Perfil tienda
        </Link>
        <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sky-100/50">
          Panel clásico
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-sky-100/90">
          Tus torneos
        </h2>

        {loading && (
          <p className="text-sm text-sky-100/50">Cargando torneos…</p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p className="rounded-xl border border-dashed border-sky-500/20 p-6 text-center text-sm text-sky-100/50">
            Aún no has creado torneos. Usa el botón de abajo para publicar el
            primero.
          </p>
        )}

        <ul className="space-y-3">
          {events.map((ev) => (
            <StoreEventCard key={ev.id} event={ev} />
          ))}
        </ul>
      </section>

      <Link
        href="/dashboard/store/new-event"
        className="sub-btn-primary fixed bottom-6 right-6 z-10 rounded-full px-5 py-3 text-sm shadow-lg shadow-sky-500/20"
      >
        + Crear Nuevo Torneo
      </Link>
    </div>
  );
}
