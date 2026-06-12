import type { ParsedDeckCard, PokemonDeckParseResult } from "@/lib/deckParser";
import {
  hasStructuredDeckSections,
  mergeCategoryCards,
  parsePokemonDecklist,
} from "@/lib/deckParser";
import { lookupCardCategory } from "./tcgdex";

const BATCH_SIZE = 8;

async function enrichCards(cards: ParsedDeckCard[]): Promise<void> {
  const pending = cards.filter(
    (c) => !c.sectionAssigned && c.setCode && c.number
  );

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (card) => {
        const looked = await lookupCardCategory(
          card.setCode!,
          card.number!,
          card.name
        );
        if (looked) card.category = looked;
      })
    );
  }
}

/**
 * Parsea un mazo y enriquece categorías con TCGdex cuando el paste no trae secciones.
 */
export async function parseAndEnrichPokemonDecklist(
  text: string
): Promise<PokemonDeckParseResult> {
  const result = parsePokemonDecklist(text);

  if (!hasStructuredDeckSections(text)) {
    await enrichCards(result.cards);
    result.categories = mergeCategoryCards(result.cards);
  }

  return result;
}
