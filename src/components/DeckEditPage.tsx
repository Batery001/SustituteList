"use client";

import { useCallback, useEffect, useState } from "react";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { DeckView } from "@/components/DeckView";
import { StoreClock } from "@/components/StoreClock";
import { Button } from "@/components/ui/Button";
import { getTimezoneLabel } from "@/lib/event-utils";
import type { Division } from "@/lib/division";
import { formatDeadline } from "@/lib/event-utils";
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
  const [rawText, setRawText] = useState("");
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
    setRawText(json.submission.rawText);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave() {
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
  const deadlineLabel = formatDeadline(
    new Date(event.decklistDeadlineAt),
    store.timezone
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-3 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-amber-200">{event.name}</p>
          <p className="mt-1 text-xs text-zinc-400">
            {event.canEdit
              ? `Puedes editar hasta ${deadlineLabel} (${getTimezoneLabel(store.timezone)})`
              : `Envío cerrado (${deadlineLabel})`}
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="mt-3 text-sm font-semibold text-amber-400 underline"
          >
            {copied ? "¡Enlace copiado!" : "Copiar mi enlace personal"}
          </button>
        </div>
        <StoreClock timeZone={store.timezone} />
      </div>

      {mode === "view" ? (
        <>
          <DeckView
            playerName={submission.playerName}
            popId={submission.popId}
            division={submission.division}
            cards={submission.parsedCards}
            cardCount={submission.validation.cardCount}
            updatedAt={submission.updatedAt}
            readOnly={!event.canEdit}
          />
          {event.canEdit && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => setMode("edit")}
            >
              Editar lista
            </Button>
          )}
        </>
      ) : (
        <>
          <DecklistTextarea value={rawText} onChange={setRawText} />
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {saved && (
            <p className="text-sm text-emerald-400">¡Lista guardada!</p>
          )}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => {
                setRawText(submission.rawText);
                setMode("view");
                setError(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </>
      )}

      <p className="text-center text-xs text-zinc-600">
        Guarda esta página en favoritos — es tu único enlace para editar en este
        torneo.
      </p>
    </div>
  );
}
