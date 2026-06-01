"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
import { formatDivision, getDivision } from "@/lib/division";
import { getValidationErrors } from "@/lib/validation-display";

interface EventSubmitFormProps {
  eventSlug: string;
  canSubmit: boolean;
  deadlineLabel: string;
}

export function EventSubmitForm({
  eventSlug,
  canSubmit,
  deadlineLabel,
}: EventSubmitFormProps) {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [popId, setPopId] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingToken, setExistingToken] = useState<string | null>(null);

  const division =
    birthDate && !Number.isNaN(new Date(birthDate).getTime())
      ? getDivision(new Date(birthDate))
      : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistingToken(null);
    setLoading(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          playerName,
          popId,
          birthDate,
          rawText,
        }),
      });

      const data = await res.json();

      if (res.status === 409 && data.editToken) {
        setExistingToken(data.editToken);
        setError(data.error);
        return;
      }

      if (!res.ok) {
        if (data.validation) {
          setError(getValidationErrors(data.validation).join(" "));
        } else {
          setError(data.error ?? "No se pudo enviar la lista");
        }
        return;
      }

      router.push(`/e/${eventSlug}/deck/${data.submission.editToken}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!canSubmit) {
    return (
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6 text-center">
        <p className="font-semibold text-zinc-200">Envío cerrado</p>
        <p className="mt-2 text-sm text-zinc-400">
          La hora límite fue {deadlineLabel}. Si ya enviaste tu lista, usa tu
          enlace personal para verla.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Nombre completo
          </label>
          <input
            type="text"
            required
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Pop ID (Player ID)
          </label>
          <input
            type="text"
            required
            value={popId}
            onChange={(e) => setPopId(e.target.value)}
            placeholder="1234567890"
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Fecha de nacimiento
          </label>
          <input
            type="date"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-3 text-zinc-100 focus:border-amber-500 focus:outline-none"
          />
          {division && (
            <p className="mt-1 text-sm text-amber-400">
              División: {formatDivision(division)}
            </p>
          )}
        </div>
      </div>

      <DecklistTextarea value={rawText} onChange={setRawText} />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {error}
          {existingToken && (
            <p className="mt-2">
              <a
                href={`/e/${eventSlug}/deck/${existingToken}`}
                className="font-semibold text-amber-400 underline"
              >
                Abrir mi página de lista →
              </a>
            </p>
          )}
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Enviando…" : "Enviar lista"}
      </Button>

      <p className="text-center text-xs text-zinc-500">
        Hora límite: {deadlineLabel}. Guarda tu enlace personal después de
        enviar.
      </p>
    </form>
  );
}
