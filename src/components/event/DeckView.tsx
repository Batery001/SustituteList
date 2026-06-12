"use client";

import { formatDivision, type Division } from "@/lib/division";
import { groupParsedCardsByName } from "@/lib/deckParser";
import { DownloadDeckPdfButton } from "@/components/deck/DownloadDeckPdfButton";

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
  pdfToken?: string | null;
}

export function DeckView({
  playerName,
  popId,
  division,
  cards,
  cardCount,
  updatedAt,
  readOnly,
  pdfToken,
}: DeckViewProps) {
  const grouped = groupParsedCardsByName(
    cards.map((c) => ({ ...c, category: "pokemon" as const, lineRaw: "" }))
  );

  return (
    <div className="space-y-4">
      <div className="sub-panel rounded-xl p-4">
        <p className="text-lg font-bold text-sky-50">{playerName}</p>
        <p className="text-sm text-sky-100/50">Pop ID: {popId}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-500/30 bg-sky-500/15 px-3 py-1 text-xs font-semibold text-sky-300">
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
        {pdfToken && (
          <div className="mt-3">
            <DownloadDeckPdfButton token={pdfToken} className="w-full sm:w-auto" />
          </div>
        )}
      </div>

      <ul className="divide-y divide-sky-900/40 rounded-xl border border-sky-500/20 bg-[#060d18]/80">
        {grouped.map((card, i) => (
          <li
            key={i}
            className="flex items-baseline gap-3 px-4 py-2.5 text-sm"
          >
            <span className="w-8 shrink-0 font-mono font-bold text-sky-400">
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
