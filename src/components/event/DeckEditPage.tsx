"use client";

import { useCallback, useEffect, useState } from "react";
import { TournamentDeckEditor } from "@/components/deck/TournamentDeckEditor";
import { DeckView } from "@/components/DeckView";
import { EventTimePanel } from "@/components/EventTimePanel";
import { Button } from "@/components/ui/Button";
import type { Division } from "@/lib/division";
import { getValidationErrors } from "@/lib/validation-display";

interface DeckData {
  submission: {
    playerName: string;
    popId: string;
    division: Division;
    rawText: string;
    parsedCards: { qty: number; name: string; setCode?: string; number?: string }[];
    validation: { cardCount: number; errors?: string[]; errorMessages?: string[]; warnings: string[] };
    updatedAt: string;
  };
  event: {
    name: string;
    slug: string;
    decklistDeadlineAt: string;
    deadlinePassed: boolean;
    canEdit: boolean;
  };
  store: { timezone: string };
}

export function DeckEditPage({ token }: { token: string }) {
  const [data, setData] = useState<DeckData | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/submissions/${token}`);
    if (!res.ok) {
      setError("Lista no encontrada");
      setLoading(false);
      return;
    }
    const json = (await res.json()) as DeckData;
    setData(json);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch(`/api/submissions/${token}`);
      if (cancelled) return;
      if (!res.ok) {
        setError("Lista no encontrada");
        setLoading(false);
        return;
      }
      const json = (await res.json()) as DeckData;
      if (cancelled) return;
      setData(json);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSave(rawText: string) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/submissions/${token}`, {
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

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <p className="py-12 text-center text-zinc-400">Cargando tu lista…</p>
    );
  }

  if (error && !data) {
    return (
      <p className="py-12 text-center text-red-400">{error}</p>
    );
  }

  if (!data) return null;

  const { submission, event, store } = data;

  return (
    <div className="space-y-6">
      <EventTimePanel
        eventName={event.name}
        deadline={new Date(event.decklistDeadlineAt)}
        timeZone={store.timezone}
        canSubmit={event.canEdit}
        footer={
          <button
            type="button"
            onClick={copyLink}
            className="sub-link mt-3 text-sm font-semibold underline"
          >
            {copied ? "¡Enlace copiado!" : "Copiar mi enlace personal"}
          </button>
        }
      />

      {mode === "view" ? (
        <>
          <DeckView
            playerName={submission.playerName}
            popId={submission.popId}
            division={submission.division}
            cards={submission.parsedCards}
            rawText={submission.rawText}
            cardCount={submission.validation.cardCount}
            updatedAt={submission.updatedAt}
            readOnly={!event.canEdit}
            pdfToken={token}
          />
          {event.canEdit && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setMode("edit")}
            >
              Cambiar lista
            </Button>
          )}
        </>
      ) : (
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
      )}

      <p className="text-center text-xs text-zinc-600">
        Guarda esta página en favoritos — es tu único enlace para editar en este
        torneo.
      </p>
    </div>
  );
}
