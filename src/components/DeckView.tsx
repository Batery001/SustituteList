"use client";

import { formatDivision, type Division } from "@/lib/division";
import { groupCardsByName } from "@/lib/decklist-parser";

interface Card {
  qty: number;
  name: string;
  setCode?: string;
  number?: string;
}

interface DeckViewProps {
  playerName: string;
  popId: string;
  division: Division;
  cards: Card[];
  cardCount: number;
  updatedAt?: string;
  readOnly?: boolean;
}

export function DeckView({
  playerName,
  popId,
  division,
  cards,
  cardCount,
  updatedAt,
  readOnly,
}: DeckViewProps) {
  const grouped = groupCardsByName(
    cards.map((c) => ({ ...c, lineRaw: "" }))
  );

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 p-4">
        <p className="text-lg font-bold text-zinc-50">{playerName}</p>
        <p className="text-sm text-zinc-400">Pop ID: {popId}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-300">
            {formatDivision(division)}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              cardCount === 60
                ? "bg-emerald-500/20 text-emerald-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {cardCount}/60 cartas
          </span>
          {readOnly && (
            <span className="rounded-full bg-zinc-700 px-3 py-1 text-xs text-zinc-300">
              Solo lectura
            </span>
          )}
        </div>
        {updatedAt && (
          <p className="mt-2 text-xs text-zinc-500">
            Última actualización:{" "}
            {new Date(updatedAt).toLocaleString("es")}
          </p>
        )}
      </div>

      <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-700 bg-zinc-950">
        {grouped.map((card, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
          >
            <span className="w-8 shrink-0 font-mono font-bold text-amber-400">
              {card.qty}
            </span>
            <span className="flex-1 text-zinc-100">{card.name}</span>
            {card.setCode && (
              <span className="shrink-0 font-mono text-xs text-zinc-500">
                {card.setCode} {card.number}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
