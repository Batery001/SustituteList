"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const TYPE_OPTIONS = [
  { value: "cup", label: "League Cup" },
  { value: "challenge", label: "League Challenge" },
  { value: "local", label: "Torneo Local" },
] as const;

export function CreateEventForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"cup" | "challenge" | "local">("challenge");
  const [startsAt, setStartsAt] = useState("");
  const [decklistDeadlineAt, setDecklistDeadlineAt] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function validateClient(): string | null {
    if (!title.trim()) return "El título es obligatorio";
    if (!startsAt || !decklistDeadlineAt) return "Completa las fechas";
    const now = Date.now();
    const start = new Date(startsAt).getTime();
    const deadline = new Date(decklistDeadlineAt).getTime();
    if (start <= now) return "La fecha del torneo debe ser futura";
    if (deadline <= now) return "El límite de decklist debe ser futuro";
    if (deadline >= start) {
      return "El límite de decklist debe ser anterior al inicio";
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientError = validateClient();
    if (clientError) {
      setError(clientError);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/events/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        type,
        startsAt,
        decklistDeadlineAt,
        maxPlayers: maxPlayers ? Number(maxPlayers) : undefined,
        price: price ? Number(price) : 0,
        clientTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      event?: { id: string };
    };

    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "No se pudo crear el torneo");
      return;
    }

    router.push(
      data.event?.id
        ? `/dashboard/store/events/${data.event.id}`
        : "/dashboard/store"
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-sky-200/80">
          Título del torneo
        </label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sub-input w-full px-3 py-3"
          placeholder="League Challenge — Junio 2026"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-sky-200/80">Tipo</label>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as "cup" | "challenge" | "local")
          }
          className="sub-input w-full px-3 py-3"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-sky-200/80">
          Fecha y hora de inicio
        </label>
        <input
          type="datetime-local"
          required
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-sky-200/80">
          Límite entrega decklist
        </label>
        <input
          type="datetime-local"
          required
          value={decklistDeadlineAt}
          onChange={(e) => setDecklistDeadlineAt(e.target.value)}
          className="sub-input w-full px-3 py-3"
        />
        <p className="mt-1 text-xs text-amber-300/80">
          Después de esta hora los jugadores no podrán enviar ni editar listas.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Capacidad máxima
          </label>
          <input
            type="number"
            min={1}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            className="sub-input w-full px-3 py-3"
            placeholder="32"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-sky-200/80">
            Costo inscripción (CLP)
          </label>
          <input
            type="number"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="sub-input w-full px-3 py-3"
            placeholder="10000"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? "Publicando…" : "Publicar torneo"}
        </Button>
        <Link
          href="/dashboard/store"
          className="rounded-xl border border-sky-500/30 px-5 py-3 text-center text-sm text-sky-200"
        >
          Cancelar
        </Link>
      </div>
    </form>
  );
}
