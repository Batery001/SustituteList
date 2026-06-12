"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { StoreEventCard } from "@/components/store/StoreEventCard";
import { routes } from "@/lib/routes";
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

  const active = events.filter((e) => e.status === "Active");

  return (
    <div className="relative space-y-6 pb-20">
      <div>
        <h1 className="text-lg font-semibold text-sky-50">Mis torneos</h1>
        <p className="mt-1 text-sm text-sky-100/55">
          Hola, <strong className="text-sky-200">{storeName}</strong>. Publica un
          Cup o Challenge y recibe las listas de tus jugadores sin demoras.
        </p>
      </div>

      <section className="sub-panel rounded-xl p-4 text-sm text-sky-100/70">
        <p className="font-medium text-sky-100">Cómo funciona</p>
        <ol className="mt-2 list-inside list-decimal space-y-1 text-xs">
          <li>Creas el torneo (Cup o Challenge)</li>
          <li>Compartes el link con tus jugadores</li>
          <li>Ellos se inscriben y suben su mazo de 60 cartas</li>
          <li>Descargas las listas en PDF el día del evento</li>
        </ol>
      </section>

      <div className="flex flex-wrap gap-2 text-xs">
        <Link
          href={routes.store.profile}
          className="rounded-lg border border-sky-500/20 px-3 py-1.5 text-sky-200"
        >
          Perfil y pagos
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-sky-100/90">
          {active.length > 0
            ? `Torneos abiertos (${active.length})`
            : "Torneos"}
        </h2>

        {loading && (
          <p className="text-sm text-sky-100/50">Cargando torneos…</p>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!loading && !error && events.length === 0 && (
          <p className="rounded-xl border border-dashed border-sky-500/20 p-6 text-center text-sm text-sky-100/50">
            Aún no tienes torneos. Crea un League Challenge o Cup y comparte el
            link con tus jugadores.
          </p>
        )}

        <ul className="space-y-3">
          {events.map((ev) => (
            <StoreEventCard key={ev.id} event={ev} />
          ))}
        </ul>
      </section>

      <Link
        href={routes.store.newEvent}
        className="sub-btn-primary fixed bottom-6 right-6 z-10 rounded-full px-5 py-3 text-sm shadow-lg shadow-sky-500/20"
      >
        + Nuevo torneo
      </Link>
    </div>
  );
}
