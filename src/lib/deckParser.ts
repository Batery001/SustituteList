/** Parser y validador de decklists Pokémon TCG (export PTCGL / Limitless). */

export type DeckCardCategory = "pokemon" | "trainer" | "energy";

export interface ParsedDeckCard {
  qty: number;
  name: string;
  setCode?: string;
  number?: string;
  lineRaw: string;
  category: DeckCardCategory;
}

export interface DeckCategoryPreview {
  pokemon: ParsedDeckCard[];
  trainer: ParsedDeckCard[];
  energy: ParsedDeckCard[];
  totals: { pokemon: number; trainer: number; energy: number };
}

export interface PokemonDeckParseResult {
  cards: ParsedDeckCard[];
  errors: string[];
  warnings: string[];
  cardCount: number;
  categories: DeckCategoryPreview;
  isValid: boolean;
}

const SECTION_POKEMON = /^(?:pokémon|pokemon)\b/i;
const SECTION_TRAINER = /^(?:trainer|trainers|entrenador(?:es)?)\b/i;
const SECTION_ENERGY = /^(?:energy|energ[íi]a)\b/i;

/** Formato estándar: `4 Charmander OBF 26` · `2 Boss's Orders PAL 172` */
const CARD_WITH_SET_REGEX =
  /^(\d+)\s+(.+?)\s+([A-Z0-9]{2,4})\s+(\d+[a-zA-Z]?)$/;

/** Energías sin código: `12 Basic Fire Energy` */
const ENERGY_LINE_REGEX = /^(\d+)\s+(.+)$/;

const TRAINER_NAME_HINT =
  /\b(ultra ball|nest ball|level ball|great ball|pok[eé]ball|switch|counter catcher|boss'?s orders|professor'?s research|iono|arven|judge|rare candy|super rod|rescue board|technical machine|tool|stadium|artazon|area zero|temple of sinnoh|bravery charm|exp\. share|pal pad|crushing hammer|energy switch|escape rope|electrical generator|artillery|hand trimmer|secret box|buddy-buddy|mystery food|earthen vessel)\b/i;

export function isBasicEnergy(name: string): boolean {
  const n = name.trim();
  return /^Basic(?:\s+\w+)+\s+Energy$/i.test(n);
}

export function isEnergyCardName(name: string): boolean {
  const n = name.trim();
  return isBasicEnergy(n) || /\benergy\b|\benerg[íi]a\b/i.test(n);
}

function categorizeByName(name: string): DeckCardCategory {
  if (isEnergyCardName(name)) return "energy";
  if (TRAINER_NAME_HINT.test(name)) return "trainer";
  return "pokemon";
}

function mergeCategoryCards(
  cards: ParsedDeckCard[]
): DeckCategoryPreview {
  const pokemon: ParsedDeckCard[] = [];
  const trainer: ParsedDeckCard[] = [];
  const energy: ParsedDeckCard[] = [];

  for (const card of cards) {
    if (card.category === "energy") energy.push(card);
    else if (card.category === "trainer") trainer.push(card);
    else pokemon.push(card);
  }

  const sum = (list: ParsedDeckCard[]) =>
    list.reduce((acc, c) => acc + c.qty, 0);

  return {
    pokemon,
    trainer,
    energy,
    totals: {
      pokemon: sum(pokemon),
      trainer: sum(trainer),
      energy: sum(energy),
    },
  };
}

function validateCopyLimit(cards: ParsedDeckCard[]): string[] {
  const byName = new Map<string, number>();

  for (const card of cards) {
    const key = card.name.trim().toLowerCase();
    byName.set(key, (byName.get(key) ?? 0) + card.qty);
  }

  const errors: string[] = [];
  for (const [nameKey, qty] of byName) {
    if (qty <= 4) continue;
    const displayName =
      cards.find((c) => c.name.trim().toLowerCase() === nameKey)?.name ??
      nameKey;
    if (isBasicEnergy(displayName)) continue;
    errors.push(
      `"${displayName}" tiene ${qty} copias; el máximo permitido es 4 (excepto Energías Básicas).`
    );
  }

  return errors;
}

/**
 * Parsea y valida un mazo exportado de Pokémon TCG Live u otro formato compatible.
 */
export function parsePokemonDecklist(text: string): PokemonDeckParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cards: ParsedDeckCard[] = [];

  let currentSection: DeckCardCategory | null = null;

  const lines = text
    .replace(/\uFEFF/g, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (SECTION_POKEMON.test(line)) {
      currentSection = "pokemon";
      continue;
    }
    if (SECTION_TRAINER.test(line)) {
      currentSection = "trainer";
      continue;
    }
    if (SECTION_ENERGY.test(line)) {
      currentSection = "energy";
      continue;
    }

    // Ignorar líneas de conteo de sección: "Pokémon: 20"
    if (/^(?:pokémon|pokemon|trainer|trainers|energy|energ[íi]a)\s*:\s*\d+/i.test(line)) {
      continue;
    }

    const setMatch = line.match(CARD_WITH_SET_REGEX);
    if (setMatch) {
      const qty = parseInt(setMatch[1], 10);
      if (qty < 1 || qty > 60) {
        errors.push(`Cantidad no válida en la línea: ${line}`);
        continue;
      }
      const name = setMatch[2].trim();
      const category =
        currentSection ?? categorizeByName(name);
      cards.push({
        qty,
        name,
        setCode: setMatch[3],
        number: setMatch[4],
        lineRaw: line,
        category,
      });
      continue;
    }

    const energyMatch = line.match(ENERGY_LINE_REGEX);
    if (energyMatch) {
      const qty = parseInt(energyMatch[1], 10);
      const name = energyMatch[2].trim();
      if (isEnergyCardName(name)) {
        cards.push({
          qty,
          name,
          lineRaw: line,
          category: currentSection ?? "energy",
        });
        if (!name.match(CARD_WITH_SET_REGEX)) {
          warnings.push(
            `Energía sin código de expansión (revisa manualmente): ${line}`
          );
        }
        continue;
      }
    }

    errors.push(`No se pudo leer la línea: ${line}`);
  }

  const cardCount = cards.reduce((sum, c) => sum + c.qty, 0);

  if (cardCount !== 60) {
    errors.push(
      `Tu mazo tiene ${cardCount} cartas, deben ser exactamente 60.`
    );
  }

  errors.push(...validateCopyLimit(cards));

  const categories = mergeCategoryCards(cards);

  return {
    cards,
    errors,
    warnings,
    cardCount,
    categories,
    isValid: errors.length === 0,
  };
}

/** Cartas sin `category` ni `lineRaw` para persistir en BD. */
export function toStoredParsedCards(
  cards: ParsedDeckCard[]
): Omit<ParsedDeckCard, "category" | "lineRaw">[] {
  return cards.map(({ qty, name, setCode, number }) => ({
    qty,
    name,
    setCode,
    number,
  }));
}

export function groupParsedCardsByName(
  cards: ParsedDeckCard[]
): ParsedDeckCard[] {
  const map = new Map<string, ParsedDeckCard>();

  for (const card of cards) {
    const key = `${card.name}|${card.setCode ?? ""}|${card.number ?? ""}|${card.category}`;
    const existing = map.get(key);
    if (existing) {
      existing.qty += card.qty;
    } else {
      map.set(key, { ...card });
    }
  }

  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );
}
