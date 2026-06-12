"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  addSearchResultToDeck,
  changeSlotQty,
  deckSlotsToRawText,
  deckTotal,
  expandSlotsForStrip,
  getDeckLegality,
  importRawTextToSlots,
  removeSlot,
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

const STRIP_SLOTS = 60;

function CardBackPlaceholder() {
  return (
    <div
      className="flex h-[4.5rem] w-[3.25rem] shrink-0 items-center justify-center rounded border border-sky-600/25 bg-gradient-to-br from-sky-950/80 to-sky-900/40"
      aria-hidden
    >
      <div className="h-6 w-6 rounded-full border-2 border-sky-500/30 bg-sky-800/50" />
    </div>
  );
}

function CardThumb({
  slot,
  onClick,
  title,
}: {
  slot?: DeckBuilderSlot;
  onClick?: () => void;
  title?: string;
}) {
  if (!slot) return <CardBackPlaceholder />;
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      title={title ?? `${slot.name} — clic para quitar 1`}
      className="relative h-[4.5rem] w-[3.25rem] shrink-0 overflow-hidden rounded border border-sky-500/30 bg-sky-950/50 transition hover:border-rose-400/50 hover:ring-1 hover:ring-rose-400/30"
    >
      {slot.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${slot.image}/low.webp`}
          alt={slot.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-0.5 text-center text-[7px] leading-tight text-sky-200">
          {slot.name}
        </div>
      )}
    </Tag>
  );
}

export function DeckBuilder({
  onRawTextReady,
  saveRedirect = routes.player.decks,
  showBackLink = false,
}: {
  onRawTextReady?: (rawText: string) => void;
  saveRedirect?: string;
  showBackLink?: boolean;
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
  const [copied, setCopied] = useState(false);

  const total = deckTotal(slots);
  const grouped = slotsByCategory(slots);
  const legality = useMemo(
    () => getDeckLegality(slots, format),
    [slots, format]
  );
  const stripCards = useMemo(() => expandSlotsForStrip(slots), [slots]);

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
    const t = setTimeout(() => void runSearch(), 300);
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

  function handleAddCard(card: CardSearchResult) {
    if (total >= 60) return;
    setSlots((prev) => addSearchResultToDeck(prev, card));
  }

  function handleStripClick(index: number) {
    const card = stripCards[index];
    if (!card) return;
    setSlots((prev) => changeSlotQty(prev, card.key, -1));
  }

  function handleRowRemove(key: string) {
    setSlots((prev) => removeSlot(prev, key));
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(deckSlotsToRawText(slots));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handlePasteImport() {
    const { slots: imported, errors } = importRawTextToSlots(pasteText);
    if (errors.length && deckTotal(imported) !== 60) {
      setError(errors.slice(0, 2).join(" "));
      if (imported.length === 0) return;
    }
    setSlots(imported);
    setPasteOpen(false);
    setPasteText("");
    setError(null);
  }

  async function handleSaveDeck() {
    const rawText = deckSlotsToRawText(slots);
    if (!legality.legal) {
      setError("El mazo debe ser legal y tener 60 cartas.");
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
    if (!legality.legal) {
      setError("Completa un mazo legal de 60 cartas antes de crear la lista.");
      return;
    }
    if (onRawTextReady) {
      onRawTextReady(rawText);
      return;
    }
    setSaveOpen(true);
  }

  const allRows = [
    ...grouped.pokemon,
    ...grouped.trainer,
    ...grouped.energy,
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {showBackLink && (
        <button
          type="button"
          onClick={() => router.push(routes.player.decks)}
          className="text-sm font-medium text-sky-400 hover:underline"
        >
          ← Volver a mis mazos
        </button>
      )}

      {/* Import + tips (RK9) */}
      <div className="sub-panel rounded-xl p-4">
        <p className="text-sm text-sky-100/70">
          Elegí cartas abajo con la búsqueda, o{" "}
          <button
            type="button"
            onClick={() => setPasteOpen(true)}
            className="font-semibold text-rose-400 underline decoration-rose-400/50 hover:text-rose-300"
          >
            importá desde PTCGL
          </button>
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-sky-100/50">
          <li>Tocá una carta en los resultados para sumar copias</li>
          <li>Tocá una carta en la tira o una fila de la lista para quitar</li>
          <li>Usá «Vaciar mazo» para empezar de cero</li>
        </ul>
      </div>

      {/* Formato + tipo */}
      <div className="sub-panel flex flex-wrap items-end gap-4 rounded-xl p-4">
        <label className="text-sm">
          <span className="mb-1 block text-sky-200/70">Idioma de cartas</span>
          <select
            className="sub-input px-3 py-2 text-sm"
            defaultValue="en"
            disabled
            title="Próximamente más idiomas"
          >
            <option value="en">English</option>
          </select>
        </label>
        <div>
          <span className="mb-1 block text-sm text-sky-200/70">Formato</span>
          <div className="flex flex-wrap gap-1">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFormat(f.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  format === f.id
                    ? "bg-sky-600 text-white"
                    : "bg-sky-950/50 text-sky-200/70 hover:bg-sky-900/60"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <span className="mb-1 block text-sm text-sky-200/70">Tipo</span>
          <div className="flex flex-wrap gap-1">
            {TYPE_FILTERS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTypeFilter(t.id)}
                className={`rounded-md px-2.5 py-1.5 text-xs font-medium ${
                  typeFilter === t.id
                    ? "bg-teal-600 text-white"
                    : "bg-sky-950/50 text-sky-200/70 hover:bg-sky-900/60"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Búsqueda ancha */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60">
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nombre de carta"
          className="sub-input w-full border-amber-500/40 py-3 pl-9 pr-3 text-base shadow-[0_0_0_1px_rgba(251,191,36,0.15)] focus:border-amber-400/60"
          autoComplete="off"
          spellCheck={false}
        />
        {query.trim().length > 0 && (
          <div className="sub-panel absolute left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-xl border border-sky-500/25 p-2 shadow-xl">
            {searching ? (
              <p className="px-2 py-3 text-sm text-sky-100/50">Buscando…</p>
            ) : results.length === 0 ? (
              <p className="px-2 py-3 text-sm text-sky-100/50">Sin resultados</p>
            ) : (
              <ul className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {results.map((card) => {
                  const inDeck = qtyInDeck(card);
                  return (
                    <li key={card.id}>
                      <button
                        type="button"
                        onClick={() => handleAddCard(card)}
                        disabled={total >= 60}
                        className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-sky-900/50 disabled:opacity-40"
                      >
                        {card.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={`${card.image}/low.webp`}
                            alt=""
                            className="h-14 w-10 shrink-0 rounded object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-14 w-10 shrink-0 rounded bg-sky-900/50" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-sky-50">
                            {card.name}
                          </p>
                          <p className="font-mono text-[10px] text-sky-100/40">
                            {card.setCode
                              ? `${card.setCode} ${card.number ?? ""}`.trim()
                              : "—"}
                            {inDeck > 0 && (
                              <span className="ml-1 text-teal-400">×{inDeck}</span>
                            )}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Tira visual 60 cartas (RK9) */}
      <div className="sub-panel overflow-hidden rounded-xl p-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {Array.from({ length: STRIP_SLOTS }, (_, i) => (
            <CardThumb
              key={i}
              slot={stripCards[i]}
              onClick={stripCards[i] ? () => handleStripClick(i) : undefined}
            />
          ))}
        </div>

        {/* Contadores + legalidad */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sky-500/15 pt-3 text-sm">
          <span className="text-sky-100/80">
            <strong className="font-semibold text-sky-50">
              {grouped.totals.pokemon}
            </strong>{" "}
            Pokémon
          </span>
          <span className="text-sky-100/80">
            <strong className="font-semibold text-sky-50">
              {grouped.totals.trainer}
            </strong>{" "}
            Entrenador
          </span>
          <span className="text-sky-100/80">
            <strong className="font-semibold text-sky-50">
              {grouped.totals.energy}
            </strong>{" "}
            Energía
          </span>
          <span className="text-sky-100/80">
            Total:{" "}
            <strong
              className={
                total === 60 ? "text-emerald-400" : "text-amber-300"
              }
            >
              {total}
            </strong>
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              legality.legal
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-200"
            }`}
          >
            {legality.message}
          </span>
        </div>
      </div>

      {/* Lista textual — tap fila para quitar */}
      {allRows.length > 0 && (
        <div className="sub-panel rounded-xl p-3">
          <p className="mb-2 text-xs text-sky-100/45">
            Lista del mazo — tocá una fila para quitar esa carta
          </p>
          <ul className="divide-y divide-sky-900/40 text-sm">
            {allRows.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => handleRowRemove(s.key)}
                  className="flex w-full items-baseline gap-3 px-2 py-2 text-left hover:bg-rose-950/20"
                >
                  <span className="w-6 font-mono font-bold text-sky-400">
                    {s.qty}
                  </span>
                  <span className="flex-1 text-sky-100">{s.name}</span>
                  {s.setCode && (
                    <span className="font-mono text-xs text-sky-100/35">
                      {s.setCode} {s.number}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          className="py-2 text-sm"
          disabled={slots.length === 0}
          onClick={() => void handleCopy()}
        >
          {copied ? "¡Copiado!" : "Copiar listado"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="py-2 text-sm"
          disabled={slots.length === 0}
          onClick={() => setSlots([])}
        >
          Vaciar mazo
        </Button>
        <Button
          type="button"
          className="ml-auto py-2 text-sm"
          disabled={!legality.legal}
          onClick={handleCreateList}
        >
          Crear lista
        </Button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800/50 bg-red-950/40 p-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="sub-panel w-full max-w-lg rounded-xl p-4">
            <h3 className="font-semibold text-sky-50">Importar desde PTCGL</h3>
            <p className="mt-1 text-xs text-sky-100/45">
              Pega el export de Pokémon TCG Live o tu lista en 3 bloques.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={12}
              className="sub-input mt-3 w-full resize-y font-mono text-sm"
              placeholder="Pokémon…&#10;&#10;Entrenadores…&#10;&#10;Energías…"
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
    </div>
  );
}
