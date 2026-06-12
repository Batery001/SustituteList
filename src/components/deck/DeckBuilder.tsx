"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  addSearchResultToDeck,
  changeSlotQty,
  deckSlotsToRawText,
  deckTotal,
  importRawTextToSlots,
  slotsByCategory,
  type CardSearchResult,
  type DeckBuilderSlot,
  type DeckFormat,
  type DeckTypeFilter,
} from "@/lib/deck-builder";
import { routes } from "@/lib/routes";

const FORMATS: { id: DeckFormat; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "expanded", label: "Expanded" },
  { id: "glc", label: "GLC" },
];

const TYPE_FILTERS: { id: DeckTypeFilter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pokemon", label: "Pokémon" },
  { id: "trainer", label: "Entrenadores" },
  { id: "energy", label: "Energías" },
];

function QtyControls({
  qty,
  onDelta,
  compact,
}: {
  qty: number;
  onDelta: (d: number) => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex items-center gap-1 ${compact ? "" : "shrink-0"}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelta(-1);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-950/50 text-sm font-bold text-sky-200 hover:bg-sky-900/60"
        aria-label="Quitar una copia"
      >
        −
      </button>
      <span className="w-6 text-center font-mono text-sm font-bold text-sky-50">
        {qty}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelta(1);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-950/50 text-sm font-bold text-sky-200 hover:bg-sky-900/60"
        aria-label="Añadir una copia"
      >
        +
      </button>
    </div>
  );
}

export function DeckBuilder({
  onRawTextReady,
  saveRedirect = routes.player.decks,
}: {
  onRawTextReady?: (rawText: string) => void;
  saveRedirect?: string;
}) {
  const router = useRouter();
  const [format, setFormat] = useState<DeckFormat>("standard");
  const [typeFilter, setTypeFilter] = useState<DeckTypeFilter>("all");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CardSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [slots, setSlots] = useState<DeckBuilderSlot[]>([]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageOpen, setImageOpen] = useState(false);

  const total = deckTotal(slots);
  const grouped = slotsByCategory(slots);

  const runSearch = useCallback(async () => {
    if (query.trim().length < 1) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const params = new URLSearchParams({
        q: query.trim(),
        type: typeFilter,
        format,
      });
      const res = await fetch(`/api/cards/search?${params}`);
      const data = (await res.json()) as { cards?: CardSearchResult[] };
      setResults(data.cards ?? []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query, typeFilter, format]);

  useEffect(() => {
    const t = setTimeout(() => void runSearch(), 350);
    return () => clearTimeout(t);
  }, [runSearch]);

  function qtyInDeck(card: CardSearchResult): number {
    return (
      slots.find(
        (s) =>
          s.tcgdexId === card.id ||
          (s.name === card.name &&
            s.setCode === card.setCode &&
            s.number === card.number)
      )?.qty ?? 0
    );
  }

  function handleResultClick(card: CardSearchResult) {
    setSlots((prev) => addSearchResultToDeck(prev, card));
  }

  function handleResultDelta(card: CardSearchResult, delta: number) {
    const key =
      slots.find((s) => s.tcgdexId === card.id)?.key ??
      `${card.name}|${card.setCode ?? ""}|${card.number ?? ""}`;
    if (delta > 0 && qtyInDeck(card) === 0) {
      setSlots((prev) => addSearchResultToDeck(prev, card));
      return;
    }
    setSlots((prev) => changeSlotQty(prev, key, delta));
  }

  async function handleCopy() {
    const text = deckSlotsToRawText(slots);
    await navigator.clipboard.writeText(text);
  }

  function handlePasteImport() {
    const { slots: imported, errors } = importRawTextToSlots(pasteText);
    if (errors.length) {
      setError(errors.join(" "));
      return;
    }
    setSlots(imported);
    setPasteOpen(false);
    setPasteText("");
    setError(null);
  }

  async function handleSaveDeck() {
    const rawText = deckSlotsToRawText(slots);
    if (total !== 60) {
      setError("El mazo debe tener exactamente 60 cartas.");
      return;
    }
    if (!deckName.trim()) {
      setError("Escribe un nombre para el mazo.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/player/decks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: deckName.trim(), rawText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar");
        return;
      }
      if (onRawTextReady) onRawTextReady(rawText);
      router.push(saveRedirect);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setSaving(false);
    }
  }

  function handleCreateList() {
    const rawText = deckSlotsToRawText(slots);
    if (onRawTextReady) {
      onRawTextReady(rawText);
      return;
    }
    setSaveOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="sub-panel space-y-4 rounded-xl p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400/80">
            Herramientas
          </p>
          <h2 className="text-lg font-semibold text-sky-50">Armar mazo</h2>
          <p className="mt-1 text-xs text-sky-100/45">
            Haz clic en un resultado para añadir cartas. Usa − / + para ajustar
            copias. Los Pokémon llevan set; entrenadores y energías no lo
            requieren.
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-sky-200/70">Formato</p>
          <div className="flex flex-wrap gap-2">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  format === f.id
                    ? "bg-teal-600 text-white"
                    : "border border-sky-500/20 bg-sky-950/40 text-sky-200/80 hover:bg-sky-900/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-sky-200/70">
            Tipo de carta
          </p>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === t.id
                    ? "bg-teal-600 text-white"
                    : "border border-sky-500/20 bg-sky-950/40 text-sky-200/80 hover:bg-sky-900/50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="sr-only">Buscar carta</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nombre de carta (ej. wooper)"
            className="sub-input w-full px-3 py-2.5 text-sm"
            autoComplete="off"
            spellCheck={false}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mazo */}
        <div className="sub-panel flex min-h-[320px] flex-col rounded-xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-sky-50">Mazo</h3>
            <span
              className={`font-mono text-sm font-bold ${
                total === 60 ? "text-emerald-400" : "text-sky-300"
              }`}
            >
              {total} / 60
            </span>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="py-2 text-xs"
              onClick={() => setPasteOpen(true)}
            >
              Pegar lista
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="py-2 text-xs"
              disabled={slots.length === 0}
              onClick={() => void handleCopy()}
            >
              Copiar listado
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="py-2 text-xs"
              disabled={slots.length === 0}
              onClick={() => setImageOpen(true)}
            >
              Ver imagen
            </Button>
            <Button
              type="button"
              className="py-2 text-xs"
              disabled={total !== 60}
              onClick={handleCreateList}
            >
              Crear lista
            </Button>
          </div>

          {slots.length === 0 ? (
            <p className="flex flex-1 items-center justify-center text-center text-sm text-sky-100/40">
              El mazo está vacío. Buscá cartas a la derecha o usá «Pegar lista»
              para importar un bloque de texto.
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto text-sm">
              {(
                [
                  ["Pokémon", grouped.pokemon, grouped.totals.pokemon],
                  ["Entrenadores", grouped.trainer, grouped.totals.trainer],
                  ["Energías", grouped.energy, grouped.totals.energy],
                ] as const
              ).map(([title, list, subtotal]) =>
                list.length === 0 ? null : (
                  <div key={title}>
                    <p className="mb-1 text-xs font-semibold text-sky-400/80">
                      {title} ({subtotal})
                    </p>
                    <ul className="space-y-1">
                      {list.map((s) => (
                        <li
                          key={s.key}
                          className="flex items-center gap-2 rounded-lg bg-sky-950/30 px-2 py-1"
                        >
                          <QtyControls
                            qty={s.qty}
                            onDelta={(d) =>
                              setSlots((prev) => changeSlotQty(prev, s.key, d))
                            }
                            compact
                          />
                          <span className="min-w-0 flex-1 truncate text-sky-100">
                            {s.name}
                          </span>
                          {s.setCode && (
                            <span className="shrink-0 font-mono text-[10px] text-sky-100/35">
                              {s.setCode} {s.number}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Resultados */}
        <div className="sub-panel flex min-h-[320px] flex-col rounded-xl p-4">
          <h3 className="mb-3 font-semibold text-sky-50">Resultados</h3>
          {query.trim().length < 1 ? (
            <p className="flex flex-1 flex-col items-center justify-center text-center text-sm text-sky-100/40">
              <span className="mb-2 text-3xl opacity-30">⌕</span>
              Escribí al menos una letra para buscar.
            </p>
          ) : searching ? (
            <p className="text-sm text-sky-100/50">Buscando…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-sky-100/50">Sin resultados.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {results.map((card) => {
                const inDeck = qtyInDeck(card);
                return (
                  <li key={card.id}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(card)}
                      className="flex w-full items-center gap-3 rounded-lg border border-sky-500/15 bg-sky-950/30 px-2 py-2 text-left transition-colors hover:border-sky-400/30 hover:bg-sky-900/40"
                    >
                      {card.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${card.image}/low.webp`}
                          alt=""
                          className="h-12 w-9 shrink-0 rounded object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-12 w-9 shrink-0 rounded bg-sky-900/50" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-sky-50">
                          {card.name}
                        </p>
                        <p className="font-mono text-[10px] text-sky-100/40">
                          {card.setCode
                            ? `${card.setCode} ${card.number ?? ""}`.trim()
                            : "Sin código Limitless"}
                        </p>
                      </div>
                      {inDeck > 0 ? (
                        <QtyControls
                          qty={inDeck}
                          onDelta={(d) => handleResultDelta(card, d)}
                        />
                      ) : (
                        <span className="shrink-0 text-xs text-sky-400">+1</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="sub-panel w-full max-w-lg rounded-xl p-4">
            <h3 className="font-semibold text-sky-50">Pegar lista</h3>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              className="sub-input mt-3 w-full resize-y font-mono text-sm"
              placeholder="Pega tu mazo (3 bloques con línea en blanco)…"
            />
            <div className="mt-3 flex gap-2">
              <Button type="button" onClick={handlePasteImport}>
                Importar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPasteOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {saveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="sub-panel w-full max-w-md rounded-xl p-4">
            <h3 className="font-semibold text-sky-50">Guardar mazo</h3>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="Nombre del mazo"
              className="sub-input mt-3 w-full px-3 py-2"
            />
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveDeck()}
              >
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSaveOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {imageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="sub-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sky-50">Vista de cartas</h3>
              <Button
                type="button"
                variant="ghost"
                className="py-1"
                onClick={() => setImageOpen(false)}
              >
                Cerrar
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {slots.flatMap((s) =>
                Array.from({ length: s.qty }, (_, i) => (
                  <div key={`${s.key}-${i}`} className="relative">
                    {s.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`${s.image}/low.webp`}
                        alt={s.name}
                        className="w-full rounded"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-[2.5/3.5] items-center justify-center rounded bg-sky-900/50 p-1 text-center text-[10px] text-sky-200">
                        {s.name}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
