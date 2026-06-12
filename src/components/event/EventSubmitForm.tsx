"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
import { formatDivision, getDivision } from "@/lib/division";
import { getValidationErrors } from "@/lib/validation-display";

interface EventSubmitFormProps {
  eventSlug: string;
  canSubmit: boolean;
  deadlineLabel: string;
  registrationAccessToken?: string;
  playerPreview?: { playerName: string; popId: string; division: string };
}

export function EventSubmitForm({
  eventSlug,
  canSubmit,
  deadlineLabel,
  registrationAccessToken,
  playerPreview,
}: EventSubmitFormProps) {
  const router = useRouter();
  const deckOnly = Boolean(registrationAccessToken);
  const [playerName, setPlayerName] = useState(playerPreview?.playerName ?? "");
  const [popId, setPopId] = useState(playerPreview?.popId ?? "");
  const [birthDate, setBirthDate] = useState("");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [savedDecks, setSavedDecks] = useState<
    { _id: string; name: string; rawText?: string }[]
  >([]);

  useEffect(() => {
    if (!deckOnly) return;
    fetch("/api/player/decks")
      .then((r) => r.json())
      .then((data) => {
        if (data.decks?.length) {
          setSavedDecks(data.decks);
        }
      })
      .catch(() => {});
  }, [deckOnly]);

  async function loadDeckContent(deckId: string) {
    const res = await fetch(`/api/player/decks/${deckId}`);
    const data = await res.json();
    if (data.deck?.rawText) setRawText(data.deck.rawText);
  }

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
        body: JSON.stringify(
          deckOnly
            ? { eventSlug, rawText, registrationAccessToken }
            : {
                eventSlug,
                playerName,
                popId,
                birthDate,
                rawText,
                registrationAccessToken,
              }
        ),
      });

      const data = await res.json();

      if (res.status === 409 && data.editToken) {
        setExistingToken(data.editToken);
        setError(data.error);
        return;
      }

      if (!res.ok) {
        if (data.code === "PAYMENT_REQUIRED" && data.accessToken) {
          window.location.href = `/e/${eventSlug}/mi-inscripcion/${data.accessToken}`;
          return;
        }
        if (data.code === "REGISTRATION_REQUIRED") {
          setError(data.error + " Inscríbete primero en el paso 1.");
          return;
        }
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
      <div className="sub-panel rounded-xl p-6 text-center">
        <p className="font-semibold text-sky-100">Envío cerrado</p>
        <p className="mt-2 text-sm text-sky-100/55">
          La hora límite fue {deadlineLabel}. Si ya enviaste tu lista, usa tu
          enlace personal para verla.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!deckOnly && (
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-sky-200/80">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="sub-input px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sky-200/80">
              Pop ID (Player ID)
            </label>
            <input
              type="text"
              required
              value={popId}
              onChange={(e) => setPopId(e.target.value)}
              placeholder="1234567890"
              className="sub-input px-3 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sky-200/80">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              required
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="sub-input px-3 py-3"
            />
            {division && (
              <p className="mt-1 text-sm text-sky-400">
                División: {formatDivision(division)}
              </p>
            )}
          </div>
        </div>
      )}

      {deckOnly && playerPreview && (
        <p className="text-sm text-sky-100/60">
          {playerPreview.playerName} · Pop {playerPreview.popId} ·{" "}
          {formatDivision(playerPreview.division as "master")}
        </p>
      )}

      {savedDecks.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-sky-200/80">
            Cargar desde mis mazos
          </label>
          <select
            className="sub-input w-full px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) loadDeckContent(e.target.value);
            }}
          >
            <option value="">Seleccionar mazo guardado…</option>
            {savedDecks.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <Link
            href="/dashboard/player/decks"
            className="mt-1 inline-block text-xs text-sky-400 underline"
          >
            Gestionar mis mazos
          </Link>
        </div>
      )}

      <DecklistTextarea value={rawText} onChange={setRawText} />

      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {error}
          {existingToken && (
            <p className="mt-2">
              <a
                href={`/e/${eventSlug}/deck/${existingToken}`}
                className="sub-link font-semibold underline"
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

      <p className="text-center text-xs text-sky-100/40">
        Hora límite: {deadlineLabel}. Guarda tu enlace personal después de
        enviar.
      </p>
    </form>
  );
}
