/**
 * @deprecated Usa `parsePokemonDecklist` desde `@/lib/deckParser`.
 */
import {
  groupParsedCardsByName,
  parsePokemonDecklist,
  type ParsedDeckCard,
} from "@/lib/deckParser";

export type ParsedCardLine = Omit<ParsedDeckCard, "category"> & {
  category?: ParsedDeckCard["category"];
};

export interface ParseResult {
  cards: ParsedCardLine[];
  errors: string[];
  warnings: string[];
  cardCount: number;
}

export function parseDecklist(rawText: string): ParseResult {
  const result = parsePokemonDecklist(rawText);
  return {
    cards: result.cards.map((card) => {
      const { category, ...rest } = card;
      void category;
      return rest;
    }),
    errors: result.errors,
    warnings: result.warnings,
    cardCount: result.cardCount,
  };
}

export function groupCardsByName(cards: ParsedCardLine[]): ParsedCardLine[] {
  return groupParsedCardsByName(
    cards.map((c) => ({
      ...c,
      category: c.category ?? "pokemon",
      lineRaw: c.lineRaw ?? "",
    }))
  ).map((card) => {
    const { category, ...rest } = card;
    void category;
    return rest;
  });
}

export { parsePokemonDecklist } from "@/lib/deckParser";
