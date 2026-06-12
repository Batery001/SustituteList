"use client";

import {
  groupParsedCardsByName,
  type DeckCategoryPreview,
  type PokemonDeckParseResult,
} from "@/lib/deckParser";

function CardList({
  title,
  cards,
  total,
  accent,
}: {
  title: string;
  cards: PokemonDeckParseResult["cards"];
  total: number;
  accent: string;
}) {
  const grouped = groupParsedCardsByName(cards);

  return (
    <div className="sub-panel flex flex-col rounded-xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
        <span className="rounded-md bg-sky-500/10 px-2 py-0.5 font-mono text-xs text-sky-200">
          {total}
        </span>
      </div>
      {grouped.length === 0 ? (
        <p className="text-xs text-sky-100/40">Sin cartas</p>
      ) : (
        <ul className="max-h-56 space-y-1 overflow-y-auto text-sm">
          {grouped.map((card, i) => (
            <li key={i} className="flex gap-2 text-sky-100/85">
              <span className="w-6 shrink-0 font-mono font-bold text-sky-400">
                {card.qty}
              </span>
              <span className="min-w-0 flex-1">{card.name}</span>
              {card.setCode && (
                <span className="shrink-0 font-mono text-[10px] text-sky-100/35">
                  {card.setCode} {card.number}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function DeckCategoryPreviewPanel({
  categories,
  cardCount,
}: {
  categories: DeckCategoryPreview;
  cardCount: number;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-950/30 px-4 py-3">
        <p className="text-sm font-medium text-emerald-200">
          Mazo válido — {cardCount}/60 cartas
        </p>
        <span className="text-xs text-emerald-300/80">Listo para enviar</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <CardList
          title="Pokémon"
          cards={categories.pokemon}
          total={categories.totals.pokemon}
          accent="text-rose-300"
        />
        <CardList
          title="Entrenadores"
          cards={categories.trainer}
          total={categories.totals.trainer}
          accent="text-amber-300"
        />
        <CardList
          title="Energías"
          cards={categories.energy}
          total={categories.totals.energy}
          accent="text-cyan-300"
        />
      </div>
    </div>
  );
}
