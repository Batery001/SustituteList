"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { StoreClock } from "@/components/StoreClock";
import { Button } from "@/components/ui/Button";
import { formatDivision, type Division } from "@/lib/division";
import { formatDeadline } from "@/lib/event-utils";

interface EventItem {
  _id: string;
  name: string;
  slug: string;
  type: string;
  status: string;
  decklistDeadlineAt: string;
  startsAt: string;
}

interface Submission {
  _id: string;
  playerName: string;
  popId: string;
  division: Division;
  validation: { cardCount: number };
  updatedAt: string;
  editToken: string;
}

const STATUS_LABELS: Record<string, string> = {
  open: "abierto",
  closed: "cerrado",
  archived: "archivado",
};

export function AdminDashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [openEvent, setOpenEvent] = useState<EventItem | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storeTimezone, setStoreTimezone] = useState("America/Santiago");

  const [form, setForm] = useState({
    name: "",
    type: "challenge" as "cup" | "challenge" | "local",
    startsAt: "",
    decklistDeadlineAt: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/events");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setOpenEvent(data.openEvent ?? null);
    setStoreTimezone(data.storeTimezone ?? "America/Santiago");

    if (data.openEvent?._id) {
      const subRes = await fetch(
        `/api/submissions?eventId=${data.openEvent._id}`
      );
      const subData = await subRes.json();
      setSubmissions(subData.submissions ?? []);
    } else {
      setSubmissions([]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setMessage(data.error ?? "No se pudo crear el torneo");
      return;
    }

    setMessage(`Torneo creado. Enlace jugadores: /e/${data.event.slug}`);
    setForm({ name: "", type: "challenge", startsAt: "", decklistDeadlineAt: "" });
    await load();
  }

  if (loading) {
    return <p className="py-12 text-center text-zinc-400">Cargando…</p>;
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Panel</h2>
        <Button type="button" variant="ghost" onClick={handleLogout}>
          Cerrar sesión
        </Button>
      </div>

      {openEvent && (
        <section className="flex gap-3 rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-emerald-400">
              Torneo activo
            </p>
            <p className="mt-1 font-bold">{openEvent.name}</p>
            <p className="mt-1 text-xs text-zinc-400">
              Límite:{" "}
              {formatDeadline(
                new Date(openEvent.decklistDeadlineAt),
                storeTimezone
              )}
            </p>
            <DeadlineCountdown
              deadlineIso={openEvent.decklistDeadlineAt}
              closed={openEvent.status !== "open"}
            />
            <p className="mt-2 break-all font-mono text-sm text-amber-300">
              {origin}/e/{openEvent.slug}
            </p>
            <Link
              href={`/e/${openEvent.slug}`}
              className="mt-3 inline-block text-sm text-zinc-400 underline"
            >
              Abrir página de jugadores →
            </Link>
          </div>
          <StoreClock timeZone={storeTimezone} />
        </section>
      )}

      <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <h3 className="font-semibold">Crear torneo</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Al publicar uno nuevo, el torneo abierto anterior se cierra solo. Las
          horas se interpretan en la zona de la tienda (STORE_TIMEZONE, ej.
          Chile).
        </p>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Nombre del torneo"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as "cup" | "challenge" | "local",
              })
            }
            className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
          >
            <option value="challenge">League Challenge</option>
            <option value="cup">League Cup</option>
            <option value="local">Torneo local</option>
          </select>
          <label className="block text-xs text-zinc-400">
            Hora límite de listas
            <input
              type="datetime-local"
              required
              value={form.decklistDeadlineAt}
              onChange={(e) =>
                setForm({ ...form, decklistDeadlineAt: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Inicio del torneo
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Creando…" : "Publicar torneo"}
          </Button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-amber-300">{message}</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Listas recibidas ({submissions.length})
          </h3>
          <button
            type="button"
            onClick={load}
            className="text-xs text-zinc-400 underline"
          >
            Actualizar
          </button>
        </div>
        {submissions.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay listas.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {submissions.map((s) => (
              <li
                key={s._id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{s.playerName}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDivision(s.division)} · Pop {s.popId} ·{" "}
                    {s.validation.cardCount} cartas
                  </p>
                </div>
                {openEvent && (
                  <Link
                    href={`/e/${openEvent.slug}/deck/${s.editToken}`}
                    className="text-sm text-amber-400 underline"
                  >
                    Ver lista
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {events.length > 0 && (
        <section className="text-xs text-zinc-600">
          <p className="font-medium text-zinc-500">Torneos recientes</p>
          <ul className="mt-2 space-y-1">
            {events.map((ev) => (
              <li key={ev._id}>
                {ev.name} — {STATUS_LABELS[ev.status] ?? ev.status} — /e/
                {ev.slug}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
