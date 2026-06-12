"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeckCategoryPreviewPanel } from "@/components/player/DeckCategoryPreviewPanel";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
import { parsePokemonDecklist } from "@/lib/deckParser";
import { routes } from "@/lib/routes";
import { getValidationErrors } from "@/lib/validation-display";

interface EventDeckStepProps {
  eventSlug: string;
  registrationAccessToken: string;
  playerName: string;
  popId: string;
  deadlineLabel: string;
  onSubmitted: (deckEditToken: string) => void;
}

export function EventDeckStep({
  eventSlug,
  registrationAccessToken,
  playerName,
  popId,
  deadlineLabel,
  onSubmitted,
}: EventDeckStepProps) {
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReturnType<
    typeof parsePokemonDecklist
  > | null>(null);
  const [savedDecks, setSavedDecks] = useState<
    { _id: string; name: string }[]
  >([]);

  useEffect(() => {
    fetch("/api/player/decks")
      .then((r) => r.json())
      .then((data) => {
        if (data.decks?.length) setSavedDecks(data.decks);
      })
      .catch(() => {});
  }, []);

  function handlePreview() {
    const result = parsePokemonDecklist(rawText);
    setPreview(result);
    if (!result.isValid) {
      setError(result.errors.join(" "));
    } else {
      setError(null);
    }
  }

  async function loadDeckContent(deckId: string) {
    const res = await fetch(`/api/player/decks/${deckId}`);
    const data = await res.json();
    if (data.deck?.rawText) {
      setRawText(data.deck.rawText);
      setPreview(null);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          rawText,
          registrationAccessToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.validation) {
          setError(getValidationErrors(data.validation).join(" "));
        } else {
          setError(data.error ?? "No se pudo enviar la lista");
        }
        return;
      }

      onSubmitted(data.submission.editToken as string);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="sub-panel rounded-xl p-4 text-sm">
        <p className="font-medium text-sky-50">{playerName}</p>
        <p className="text-sky-100/55">Pop ID {popId}</p>
        <p className="mt-2 text-xs text-sky-100/45">
          Pega tu lista exportada desde TCG Live o Limitless. Debe tener
          exactamente 60 cartas.
        </p>
      </div>

      {savedDecks.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-sky-200/80">
            Cargar un mazo guardado
          </label>
          <select
            className="sub-input w-full px-3 py-2 text-sm"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) void loadDeckContent(e.target.value);
            }}
          >
            <option value="">Elegir mazo…</option>
            {savedDecks.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <Link
            href={routes.player.decks}
            className="mt-1 inline-block text-xs text-sky-400 underline"
          >
            Mis mazos guardados
          </Link>
        </div>
      )}

      <DecklistTextarea value={rawText} onChange={setRawText} disabled={loading} />

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={!rawText.trim() || loading}
        onClick={handlePreview}
      >
        Revisar lista
      </Button>

      {preview && preview.isValid && (
        <DeckCategoryPreviewPanel
          categories={preview.categories}
          cardCount={preview.cardCount}
        />
      )}

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={loading || !rawText.trim()}
        className="w-full"
      >
        {loading ? "Enviando…" : "Enviar lista al torneo"}
      </Button>

      <p className="text-center text-xs text-sky-100/40">
        Hora límite: {deadlineLabel}
      </p>
    </form>
  );
}
