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

interface RegistrationRow {
  _id: string;
  playerName: string;
  popId: string;
  division: Division;
  paymentStatus: string;
  hasDecklist: boolean;
  deckEditToken?: string;
  accessToken: string;
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
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storeTimezone, setStoreTimezone] = useState("America/Santiago");
  const [serverClock, setServerClock] = useState<string | null>(null);
  const browserTimeZone =
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "America/Santiago";

  const [form, setForm] = useState({
    name: "",
    type: "challenge" as "cup" | "challenge" | "local",
    startsAt: "",
    decklistDeadlineAt: "",
    entryFeeCents: 0,
  });

  async function markPaid(registrationId: string) {
    const res = await fetch(`/api/registrations/${registrationId}/pay`, {
      method: "POST",
    });
    if (res.ok) await load();
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/events?scope=admin");
    if (res.status === 401) {
      router.push("/auth/login?callbackUrl=%2Fadmin");
      return;
    }
    const data = await res.json();
    setEvents(data.events ?? []);
    setOpenEvent(data.openEvent ?? null);
    setStoreTimezone(data.storeTimezone ?? "America/Santiago");
    setServerClock(data.serverNowInStoreTz ?? null);

    if (data.openEvent?._id) {
      const [subRes, regRes] = await Promise.all([
        fetch(`/api/submissions?eventId=${data.openEvent._id}`),
        fetch(`/api/registrations?eventId=${data.openEvent._id}`),
      ]);
      const subData = await subRes.json();
      const regData = await regRes.json();
      setSubmissions(subData.submissions ?? []);
      setRegistrations(regData.registrations ?? []);
    } else {
      setSubmissions([]);
      setRegistrations([]);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setMessage(null);

    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        clientTimeZone: browserTimeZone,
      }),
    });

    const data = await res.json();
    setCreating(false);

    if (!res.ok) {
      setMessage(data.error ?? "No se pudo crear el torneo");
      return;
    }

    setMessage(`Torneo creado. Enlace jugadores: /e/${data.event.slug}`);
    setForm({
      name: "",
      type: "challenge",
      startsAt: "",
      decklistDeadlineAt: "",
      entryFeeCents: 0,
    });
    await load();
  }

  if (loading) {
    return <p className="py-12 text-center text-zinc-400">Cargando…</p>;
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="space-y-8">
      {openEvent && (
        <section className="sub-panel flex gap-3 rounded-xl p-4">
          <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-sky-400">
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
            <p className="mt-2 break-all font-mono text-sm text-sky-300">
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

      <section className="sub-panel rounded-xl p-4">
        <h3 className="font-semibold">Crear torneo</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Al publicar uno nuevo, el torneo abierto anterior se cierra solo. Las
          horas del formulario son las de tu dispositivo (
          <span className="text-zinc-400">{browserTimeZone}</span>
          {serverClock && (
            <>
              ). En el servidor ahora son:{" "}
              <span className="text-sky-300">{serverClock}</span>
            </>
          )}
          {!serverClock && ")."}
        </p>
        <form onSubmit={handleCreate} className="mt-4 space-y-3">
          <input
            type="text"
            placeholder="Nombre del torneo"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="sub-input px-3 py-2 text-sm"
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm({
                ...form,
                type: e.target.value as "cup" | "challenge" | "local",
              })
            }
            className="sub-input px-3 py-2 text-sm"
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
              className="sub-input mt-1 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Inicio del torneo
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              className="sub-input mt-1 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            Cuota inscripción (CLP, 0 = gratis)
            <input
              type="number"
              min={0}
              value={form.entryFeeCents}
              onChange={(e) =>
                setForm({
                  ...form,
                  entryFeeCents: parseInt(e.target.value, 10) || 0,
                })
              }
              className="sub-input mt-1 px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "Creando…" : "Publicar torneo"}
          </Button>
        </form>
        {message && (
          <p className="mt-3 text-sm text-sky-300">{message}</p>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">
            Inscripciones ({registrations.length})
          </h3>
          <button
            type="button"
            onClick={load}
            className="text-xs text-zinc-400 underline"
          >
            Actualizar
          </button>
        </div>
        {registrations.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay inscripciones.</p>
        ) : (
          <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800">
            {registrations.map((r) => (
              <li
                key={r._id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{r.playerName}</p>
                  <p className="text-xs text-zinc-500">
                    {formatDivision(r.division)} · Pop {r.popId} ·{" "}
                    {r.paymentStatus === "paid" ? (
                      <span className="text-emerald-400">Pagado</span>
                    ) : (
                      <span className="text-amber-400">Pago pendiente</span>
                    )}
                    {r.hasDecklist ? " · Lista ✓" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.paymentStatus !== "paid" && (
                    <Button
                      type="button"
                      onClick={() => markPaid(r._id)}
                      className="text-xs"
                    >
                      Marcar pagado
                    </Button>
                  )}
                  {openEvent && (
                    <Link
                      href={`/e/${openEvent.slug}/mi-inscripcion/${r.accessToken}`}
                      className="text-xs text-zinc-400 underline"
                    >
                      Ver jugador
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
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
                    className="sub-link text-sm underline"
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
