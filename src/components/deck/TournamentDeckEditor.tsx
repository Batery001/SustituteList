"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DeckBuilder } from "@/components/deck/DeckBuilder";
import { DeckCategoryPreviewPanel } from "@/components/player/DeckCategoryPreviewPanel";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
import type { PokemonDeckParseResult } from "@/lib/deckParser";
import { routes } from "@/lib/routes";

interface TournamentDeckEditorProps {
  initialRawText: string;
  onSave: (rawText: string) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  saved?: boolean;
  saveLabel?: string;
}

export function TournamentDeckEditor({
  initialRawText,
  onSave,
  onCancel,
  saving,
  error,
  saved,
  saveLabel = "Guardar cambios",
}: TournamentDeckEditorProps) {
  const [rawText, setRawText] = useState(initialRawText);
  const [mode, setMode] = useState<"paste" | "build">("paste");
  const [buildKey, setBuildKey] = useState(0);
  const [preview, setPreview] = useState<PokemonDeckParseResult | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [savedDecks, setSavedDecks] = useState<{ _id: string; name: string }[]>(
    []
  );

  useEffect(() => {
    setRawText(initialRawText);
  }, [initialRawText]);

  useEffect(() => {
    fetch("/api/player/decks")
      .then((r) => r.json())
      .then((data) => {
        if (data.decks?.length) setSavedDecks(data.decks);
      })
      .catch(() => {});
  }, []);

  async function handlePreview() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = (await res.json()) as PokemonDeckParseResult & {
        error?: string;
      };
      if (!res.ok) {
        setPreview(null);
        return;
      }
      setPreview(data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewing(false);
    }
  }

  async function loadDeckContent(deckId: string) {
    const res = await fetch(`/api/player/decks/${deckId}`);
    const data = await res.json();
    if (data.deck?.rawText) {
      setRawText(data.deck.rawText);
      setPreview(null);
    }
  }

  function switchToPaste(text?: string) {
    if (text !== undefined) setRawText(text);
    setMode("paste");
    setPreview(null);
  }

  if (mode === "build") {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 border-b border-sky-500/20 pb-3">
          <button
            type="button"
            onClick={() => setMode("build")}
            className="rounded-lg bg-teal-600/20 px-3 py-1.5 text-sm font-medium text-teal-200"
          >
            Armar mazo
          </button>
          <button
            type="button"
            onClick={() => switchToPaste()}
            className="rounded-lg px-3 py-1.5 text-sm text-sky-200/60 hover:bg-sky-950/50"
          >
            Pegar lista
          </button>
        </div>
        <DeckBuilder
          key={buildKey}
          initialRawText={rawText}
          onRawTextReady={(text) => switchToPaste(text)}
          applyListLabel="Usar esta lista"
        />
        <Button type="button" variant="ghost" className="w-full" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-sky-100/45">
        Puedes reemplazar tu lista completa: arma un mazo nuevo, pega otro export
        o carga un mazo guardado.
      </p>

      <div className="flex gap-2 border-b border-sky-500/20 pb-3">
          <button
            type="button"
            onClick={() => {
              setBuildKey((k) => k + 1);
              setMode("build");
            }}
            className="rounded-lg px-3 py-1.5 text-sm text-sky-200/60 hover:bg-sky-950/50"
          >
            Armar mazo
          </button>
        <span className="rounded-lg bg-teal-600/20 px-3 py-1.5 text-sm font-medium text-teal-200">
          Pegar lista
        </span>
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

      <DecklistTextarea
        value={rawText}
        onChange={(text) => {
          setRawText(text);
          setPreview(null);
        }}
        disabled={saving}
      />

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={!rawText.trim() || saving || previewing}
        onClick={() => void handlePreview()}
      >
        {previewing ? "Clasificando cartas…" : "Revisar lista"}
      </Button>

      {preview && preview.isValid && (
        <DeckCategoryPreviewPanel
          categories={preview.categories}
          cardCount={preview.cardCount}
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && (
        <p className="text-sm text-emerald-400">Lista actualizada correctamente.</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={saving || !rawText.trim()}
          onClick={() => void onSave(rawText)}
        >
          {saving ? "Guardando…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
