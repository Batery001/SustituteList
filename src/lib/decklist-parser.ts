import { msg } from "@/lib/messages";

export interface ParsedCardLine {
  qty: number;
  name: string;
  setCode?: string;
  number?: string;
  lineRaw: string;
}

export interface ParseResult {
  cards: ParsedCardLine[];
  errors: string[];
  warnings: string[];
  cardCount: number;
}

const SECTION_HEADERS =
  /^(pokémon|pokemon|trainer|trainers|energy|energía|energia)$/i;

// e.g. 4 Charmander OBF 26  |  2 Boss's Orders PAL 172
const CARD_LINE =
  /^(\d+)\s+(.+?)\s+([A-Z0-9]{2,4})\s+(\d+[a-zA-Z]?)$/;

// e.g. 12 Basic Fire Energy (no set)
const ENERGY_LINE = /^(\d+)\s+(.+)$/;

export function parseDecklist(rawText: string): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cards: ParsedCardLine[] = [];

  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (SECTION_HEADERS.test(line)) continue;

    const match = line.match(CARD_LINE);
    if (match) {
      const qty = parseInt(match[1], 10);
      if (qty < 1 || qty > 60) {
        errors.push(msg.parser.invalidQty(line));
        continue;
      }
      cards.push({
        qty,
        name: match[2].trim(),
        setCode: match[3],
        number: match[4],
        lineRaw: line,
      });
      continue;
    }

    const energyMatch = line.match(ENERGY_LINE);
    if (energyMatch) {
      const qty = parseInt(energyMatch[1], 10);
      const name = energyMatch[2].trim();
      if (/energy/i.test(name) || /énerg/i.test(name)) {
        cards.push({ qty, name, lineRaw: line });
        warnings.push(msg.parser.energyNoSet(line));
        continue;
      }
    }

    errors.push(msg.parser.cannotParse(line));
  }

  const cardCount = cards.reduce((sum, c) => sum + c.qty, 0);

  if (cardCount !== 60) {
    errors.push(msg.parser.not60Cards(cardCount));
  }

  return { cards, errors, warnings, cardCount };
}

export function groupCardsByName(cards: ParsedCardLine[]): ParsedCardLine[] {
  const map = new Map<string, ParsedCardLine>();

  for (const card of cards) {
    const key = `${card.name}|${card.setCode ?? ""}|${card.number ?? ""}`;
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
