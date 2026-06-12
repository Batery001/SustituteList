"use client";

import { useCallback, useEffect, useState } from "react";
import { TournamentDeckEditor } from "@/components/deck/TournamentDeckEditor";
import { DeckView } from "@/components/DeckView";
import { Button } from "@/components/ui/Button";
import type { Division } from "@/lib/division";
import { getValidationErrors } from "@/lib/validation-display";

interface DeckData {
  submission: {
    playerName: string;
    popId: string;
    division: Division;
    rawText: string;
    parsedCards: {
      qty: number;
      name: string;
      setCode?: string;
      number?: string;
    }[];
    validation: {
      cardCount: number;
      errors?: string[];
      errorMessages?: string[];
      warnings: string[];
    };
    updatedAt: string;
  };
  event: { canEdit: boolean };
}

export function EventDeckInline({
  deckEditToken,
  deadlineLabel,
}: {
  deckEditToken: string;
  deadlineLabel: string;
}) {
  const [data, setData] = useState<DeckData | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/submissions/${deckEditToken}`);
    if (!res.ok) {
      setError("No se pudo cargar la lista");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as DeckData;
    setData(json);
    setLoading(false);
  }, [deckEditToken]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/submissions/${deckEditToken}`);
      if (cancelled) return;
      if (!res.ok) {
        setError("No se pudo cargar la lista");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as DeckData;
      setData(json);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [deckEditToken]);

  async function handleSave(rawText: string) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/submissions/${deckEditToken}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.validation
            ? getValidationErrors(json.validation).join(" ")
            : (json.error ?? "No se pudo guardar")
        );
        return;
      }
      setSaved(true);
      setMode("view");
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="py-4 text-center text-sm text-sky-100/50">Cargando lista…</p>;
  }

  if (error && !data) {
    return <p className="text-sm text-red-400">{error}</p>;
  }

  if (!data) return null;

  const { submission, event } = data;

  if (mode === "view") {
    return (
      <div className="space-y-4">
        <DeckView
          playerName={submission.playerName}
          popId={submission.popId}
          division={submission.division}
          cards={submission.parsedCards}
          rawText={submission.rawText}
          cardCount={submission.validation.cardCount}
          updatedAt={submission.updatedAt}
          readOnly={!event.canEdit}
          pdfToken={deckEditToken}
        />
        {event.canEdit && (
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => {
              setMode("edit");
              setSaved(false);
            }}
          >
            Cambiar lista
          </Button>
        )}
        {!event.canEdit && (
          <p className="text-center text-xs text-sky-100/45">
            El plazo de edición terminó ({deadlineLabel}).
          </p>
        )}
      </div>
    );
  }

  return (
    <TournamentDeckEditor
      initialRawText={submission.rawText}
      onSave={handleSave}
      onCancel={() => {
        setMode("view");
        setError(null);
      }}
      saving={saving}
      error={error}
      saved={saved}
    />
  );
}
