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
  email?: string | null;
  division: Division;
  paymentStatus: string;
  hasDecklist: boolean;
  deckEditToken?: string | null;
  accessToken: string;
};

type RowFilter = "all" | "missing-list" | "pending-pay";

type DivisionTab = Division | "all";

const DIVISIONS: Division[] = ["master", "senior", "junior"];

export function EventRegistrationsPanel({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<StoreEventSummary | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationRow[]>([]);
  const [tab, setTab] = useState<DivisionTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [rowFilter, setRowFilter] = useState<RowFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);

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

  async function removePlayer(r: RegistrationRow) {
    const ok = window.confirm(
      `¿Sacar a ${r.playerName} del torneo? Se eliminará su inscripción${
        r.hasDecklist ? " y su lista" : ""
      }.`
    );
    if (!ok) return;

    setRemovingId(r._id);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/${r._id}/remove`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo sacar al jugador");
        return;
      }
      await load();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setRemovingId(null);
    }
  }

  async function downloadExport(format: "csv" | "pdfs") {
    setBusy(format);
    setError(null);
    try {
      const res = await fetch(
        `/api/events/store/${eventId}/export?format=${format}`
      );
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "No se pudo exportar");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "inscritos.csv" : "listas.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  async function toggleEventOpen() {
    if (!event) return;
    const closing = event.status === "Active";
    const ok = window.confirm(
      closing
        ? "¿Cerrar inscripciones y envío de listas de este torneo?"
        : "¿Reabrir el torneo para inscripciones y listas?"
    );
    if (!ok) return;
    setBusy("status");
    setError(null);
    try {
      const res = await fetch(`/api/events/store/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: closing ? "close" : "reopen" }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "No se pudo cambiar el estado");
        return;
      }
      await load();
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  async function notify(kind: "missing-list" | "deadline", registrationId?: string) {
    setBusy("notify");
    setError(null);
    try {
      const res = await fetch(`/api/events/store/${eventId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, registrationId }),
      });
      const data = (await res.json()) as {
        error?: string;
        sent?: number;
        skipped?: number;
      };
      if (!res.ok) {
        setError(data.error ?? "No se pudieron enviar los avisos");
        return;
      }
      window.alert(
        `Correos enviados: ${data.sent ?? 0}. Sin correo o ya tenían lista: ${data.skipped ?? 0}.`
      );
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setBusy(null);
    }
  }

  function playerUrl(r: RegistrationRow) {
    if (!event) return "";
    return `${window.location.origin}/e/${event.slug}/mi-inscripcion/${r.accessToken}`;
  }

  async function copyPlayerLink(r: RegistrationRow) {
    await navigator.clipboard.writeText(playerUrl(r));
  }

  function whatsappPlayer(r: RegistrationRow) {
    if (!event) return;
    const text = r.hasDecklist
      ? `Hola ${r.playerName}, tu inscripción a ${event.title} está lista. ${playerUrl(r)}`
      : `Hola ${r.playerName}, te falta enviar la lista para ${event.title}. Entra aquí: ${playerUrl(r)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
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
  const filtered = (tab === "all" ? registrations : byDivision(tab)).filter(
    (r) => {
      if (rowFilter === "missing-list") return !r.hasDecklist;
      if (rowFilter === "pending-pay") return r.paymentStatus !== "paid";
      return true;
    }
  );
  const visible = filtered;

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

  if (!event) {
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
              {event.allowedRegulationMarks?.length
                ? ` · Regulación ${event.allowedRegulationMarks.join("/")}`
                : ""}
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
          href={`/e/${event.slug}?vista=publica`}
          target="_blank"
          className="rounded-lg border border-sky-500/25 px-4 py-2 text-sm text-sky-200"
        >
          Ver como jugador
        </Link>
        <Button
          type="button"
          className="text-sm"
          disabled={busy === "csv"}
          onClick={() => void downloadExport("csv")}
        >
          {busy === "csv" ? "…" : "Exportar CSV"}
        </Button>
        <Button
          type="button"
          className="text-sm"
          disabled={busy === "pdfs"}
          onClick={() => void downloadExport("pdfs")}
        >
          {busy === "pdfs" ? "…" : "ZIP de listas"}
        </Button>
        <Button
          type="button"
          className="text-sm"
          disabled={busy === "status"}
          onClick={() => void toggleEventOpen()}
        >
          {event.status === "Active" ? "Cerrar torneo" : "Reabrir torneo"}
        </Button>
        {event.emailConfigured ? (
          <>
            <button
              type="button"
              disabled={busy === "notify"}
              onClick={() => void notify("missing-list")}
              className="rounded-lg border border-amber-500/30 px-4 py-2 text-sm text-amber-200"
            >
              Avisar falta lista
            </button>
            <button
              type="button"
              disabled={busy === "notify"}
              onClick={() => void notify("deadline")}
              className="rounded-lg border border-sky-500/25 px-4 py-2 text-sm text-sky-200"
            >
              Recordar plazo
            </button>
          </>
        ) : (
          <p className="self-center text-xs text-sky-100/40">
            Para correos: SMTP de Gmail o RESEND_API_KEY en Vercel.
          </p>
        )}
      </div>

      <p className="text-xs text-sky-100/45">
        Comparte el link con tus jugadores. Ahí se inscriben, confirman asistencia
        y suben su lista de 60 cartas en un solo lugar.
      </p>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <div className="flex gap-1 border-b border-sky-500/15 pb-2">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
            tab === "all"
              ? "bg-sky-500/20 text-sky-100"
              : "text-sky-100/45 hover:text-sky-100"
          }`}
        >
          Todos ({registrations.length})
        </button>
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

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Todos los filtros"],
            ["missing-list", "Falta lista"],
            ["pending-pay", "Pago pendiente"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setRowFilter(id)}
            className={`rounded-md px-2 py-1 text-xs ${
              rowFilter === id
                ? "bg-amber-500/20 text-amber-100"
                : "text-sky-100/45 hover:text-sky-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <section>
        {visible.length === 0 ? (
          <p className="text-sm text-sky-100/50">
            {tab === "all"
              ? "Aún no hay inscritos."
              : `Sin inscritos en ${formatDivision(tab)}.`}
          </p>
        ) : (
          <ul className="divide-y divide-sky-500/15 rounded-xl border border-sky-500/20">
            {visible.map((r) => (
              <li
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sky-50">{r.playerName}</p>
                  <p className="text-xs text-sky-100/50">
                    Pop ID {r.popId} · {formatDivision(r.division)}
                    {r.email ? ` · ${r.email}` : ""}
                  </p>
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
                      {r.deckEditToken && event && (
                        <>
                          <Link
                            href={`/e/${event.slug}/deck/${r.deckEditToken}`}
                            className="rounded-md border border-sky-500/30 px-2 py-1 text-sky-200 hover:bg-sky-900/50"
                          >
                            Ver lista
                          </Link>
                          <DownloadDeckPdfButton
                            token={r.deckEditToken}
                            className="px-2 py-1 text-xs"
                          />
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-amber-300">Sin lista</span>
                  )}
                  <button
                    type="button"
                    onClick={() => void copyPlayerLink(r)}
                    className="rounded-md border border-sky-500/25 px-2 py-1 text-sky-200 hover:bg-sky-900/50"
                  >
                    Copiar link
                  </button>
                  <button
                    type="button"
                    onClick={() => whatsappPlayer(r)}
                    className="rounded-md border border-emerald-500/25 px-2 py-1 text-emerald-200 hover:bg-emerald-950/40"
                  >
                    WhatsApp
                  </button>
                  {event.emailConfigured && r.email && !r.hasDecklist && (
                    <button
                      type="button"
                      disabled={busy === "notify"}
                      onClick={() => void notify("missing-list", r._id)}
                      className="rounded-md border border-amber-500/30 px-2 py-1 text-amber-200"
                    >
                      Avisar
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={removingId === r._id}
                    onClick={() => void removePlayer(r)}
                    className="rounded-md border border-rose-500/35 px-2 py-1 text-rose-300 hover:bg-rose-950/50 disabled:opacity-50"
                  >
                    {removingId === r._id ? "…" : "No se presentó"}
                  </button>
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
