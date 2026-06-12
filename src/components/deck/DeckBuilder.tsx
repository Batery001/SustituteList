"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  addSearchResultToDeck,
  deckSlotsToRawText,
  deckTotal,
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

/** Cartas visibles en la fila de búsqueda (resultados + reversos de relleno). */
const SEARCH_ROW_SLOTS = 60;

function CardBackPlaceholder() {
  return (
    <div
      className="h-[5.5rem] w-[4rem] shrink-0 rounded-sm border border-zinc-600/40 bg-gradient-to-br from-zinc-700/80 to-zinc-800/90"
      aria-hidden
    />
  );
}

function formatCardCode(card: { setCode?: string; number?: string }): string {
  if (card.setCode && card.number) return `${card.setCode}-${card.number}`;
  if (card.setCode) return card.setCode;
  return "";
}

function SearchResultCard({
  card,
  onAdd,
  disabled,
}: {
  card: CardSearchResult;
  onAdd: () => void;
  disabled?: boolean;
}) {
  const code = formatCardCode(card);
  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      title={code ? `${card.name} (${code})` : card.name}
      className="h-[5.5rem] w-[4rem] shrink-0 overflow-hidden rounded-sm border border-sky-500/30 bg-sky-950/40 transition hover:border-teal-400/50 hover:ring-2 hover:ring-teal-400/30 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {card.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${card.image}/low.webp`}
          alt={card.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-1 text-center text-[8px] leading-tight text-sky-200">
          {card.name}
        </div>
      )}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4 shrink-0 text-sky-100/35"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 8.519A2.75 2.75 0 007.596 17h4.807a2.75 2.75 0 002.742-2.53l.841-8.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.28 0 .502.214.512.483l.001 1.017a.75.75 0 01-1.002.711L9.5 6.5v-.517A.512.512 0 0110 4zM8.25 6.5v.517l.001 1.017a.75.75 0 01-1.002.711L7.25 8.25V6.5h1zm3.5 0v1.75a.75.75 0 01-1.002.711L10.5 8.267V6.5h1.25z"
        clipRule="evenodd"
      />
    </svg>
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

  function handleAddCard(card: CardSearchResult) {
    if (total >= 60) return;
    setSlots((prev) => addSearchResultToDeck(prev, card));
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

  const hasQuery = query.trim().length > 0;
  const fillerCount = Math.max(0, SEARCH_ROW_SLOTS - results.length);

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

      <div className="sub-panel rounded-xl p-4">
        <p className="text-sm text-sky-100/70">
          Elegí cartas en la fila de búsqueda, o{" "}
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
          <li>Tocá una fila de la lista de abajo para quitar esa carta</li>
          <li>Usá «Vaciar mazo» para empezar de cero</li>
        </ul>
      </div>

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

      {/* Búsqueda */}
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60">
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Card name"
          className="sub-input w-full border-amber-500/40 py-3 pl-9 pr-3 text-base shadow-[0_0_0_1px_rgba(251,191,36,0.15)] focus:border-amber-400/60"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Fila horizontal = RESULTADOS de búsqueda (RK9) */}
      <div className="sub-panel overflow-hidden rounded-xl p-3">
        {searching && hasQuery && (
          <p className="mb-2 text-xs text-sky-100/45">Buscando…</p>
        )}
        {hasQuery && !searching && results.length === 0 && (
          <p className="mb-2 text-xs text-sky-100/45">Sin resultados</p>
        )}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {hasQuery
            ? results.map((card) => (
                <SearchResultCard
                  key={card.id}
                  card={card}
                  onAdd={() => handleAddCard(card)}
                  disabled={total >= 60}
                />
              ))
            : null}
          {Array.from({
            length: hasQuery ? fillerCount : SEARCH_ROW_SLOTS,
          }).map((_, i) => (
            <CardBackPlaceholder key={`back-${i}`} />
          ))}
        </div>

        {/* Contadores */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-sky-500/15 pt-3 text-sm">
          <span className="text-sky-100/80">
            Pokémon:{" "}
            <strong className="font-semibold text-sky-50">
              {grouped.totals.pokemon}
            </strong>
          </span>
          <span className="text-sky-100/80">
            Entrenador:{" "}
            <strong className="font-semibold text-sky-50">
              {grouped.totals.trainer}
            </strong>
          </span>
          <span className="text-sky-100/80">
            Energía:{" "}
            <strong className="font-semibold text-sky-50">
              {grouped.totals.energy}
            </strong>
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
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              legality.legal
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-amber-500/20 text-amber-200"
            }`}
          >
            {legality.message}
          </span>
        </div>
      </div>

      {/* Lista del mazo que se va armando (RK9) */}
      <div className="sub-panel min-h-[8rem] rounded-xl p-2">
        {slots.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-sky-100/35">
            La lista aparecerá aquí al agregar cartas desde la búsqueda.
          </p>
        ) : (
          <ul>
            {slots.map((s) => {
              const code = formatCardCode(s);
              const label = code ? `${s.name} (${code})` : s.name;
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => handleRowRemove(s.key)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-rose-950/25"
                  >
                    <TrashIcon />
                    <span className="font-medium text-sky-50">
                      {s.qty} {label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
