"use client";

import { formatDivision, type Division } from "@/lib/division";
import {
  groupParsedCardsByName,
  resolveDeckCategories,
  type DeckCardCategory,
  type StoredDeckCard,
} from "@/lib/deckParser";
import { DownloadDeckPdfButton } from "@/components/deck/DownloadDeckPdfButton";

interface DeckViewProps {
  playerName: string;
  popId: string;
  division: Division;
  cards: StoredDeckCard[];
  cardCount: number;
  rawText?: string;
  updatedAt?: string;
  readOnly?: boolean;
  pdfToken?: string | null;
}

const SECTIONS: {
  key: DeckCardCategory;
  title: string;
  accent: string;
}[] = [
  { key: "pokemon", title: "Pokémon", accent: "text-rose-300" },
  { key: "trainer", title: "Entrenadores", accent: "text-amber-300" },
  { key: "energy", title: "Energías", accent: "text-cyan-300" },
];

function SectionList({
  title,
  cards,
  total,
  accent,
}: {
  title: string;
  cards: StoredDeckCard[];
  total: number;
  accent: string;
}) {
  const grouped = groupParsedCardsByName(
    cards.map((c) => ({
      ...c,
      category: c.category ?? "pokemon",
      lineRaw: "",
    }))
  );

  if (grouped.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-sky-500/20 bg-[#060d18]/80">
      <div className="flex items-center justify-between border-b border-sky-900/40 px-4 py-2.5">
        <h3 className={`text-sm font-semibold ${accent}`}>{title}</h3>
        <span className="font-mono text-xs text-sky-200/70">{total}</span>
      </div>
      <ul className="divide-y divide-sky-900/40">
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

export function DeckView({
  playerName,
  popId,
  division,
  cards,
  cardCount,
  rawText,
  updatedAt,
  readOnly,
  pdfToken,
}: DeckViewProps) {
  const categories = resolveDeckCategories(cards, rawText);

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

      <div className="space-y-3">
        {SECTIONS.map(({ key, title, accent }) => (
          <SectionList
            key={key}
            title={title}
            cards={categories[key]}
            total={categories.totals[key]}
            accent={accent}
          />
        ))}
      </div>
    </div>
  );
}
