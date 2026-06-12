import type { DeckCardCategory } from "@/lib/deckParser";
import type { CardSearchResult, DeckFormat, DeckTypeFilter } from "@/lib/deck-builder";
import {
  enrichCardImage,
  buildTcgdexImageUrl,
} from "./tcgdex-image";
import {
  parseTcgdexCardId,
  tcgdexSetToLimitless,
} from "./limitless-set-codes";

const TCGDEX_BASE = "https://api.tcgdex.net/v2/en";
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RESULTS = 36;

type TcgdexBrief = {
  id: string;
  name: string;
  localId?: string;
  image?: string;
};

type TcgdexFull = TcgdexBrief & {
  category?: string;
  legal?: { standard?: boolean; expanded?: boolean };
  set?: { id?: string };
};

function tcgdxCategoryToDeck(category?: string): DeckCardCategory {
  const c = (category ?? "").toLowerCase();
  if (c === "trainer") return "trainer";
  if (c === "energy") return "energy";
  return "pokemon";
}

function categoryParam(filter: DeckTypeFilter): string | null {
  if (filter === "pokemon") return "Pokemon";
  if (filter === "trainer") return "Trainer";
  if (filter === "energy") return "Energy";
  return null;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function passesFormat(card: TcgdexFull, format: DeckFormat): boolean {
  if (format === "glc") return true;
  if (!card.legal) return true;
  if (format === "standard") return card.legal.standard === true;
  return card.legal.expanded === true;
}

function briefToResult(card: TcgdexFull): CardSearchResult {
  const parsed = parseTcgdexCardId(card.id);
  const tcgdexSetId = card.set?.id ?? parsed?.tcgdexSetId;
  const number = card.localId ?? parsed?.localId;
  const setCode = tcgdexSetId ? tcgdexSetToLimitless(tcgdexSetId) ?? undefined : undefined;
  const image = buildTcgdexImageUrl(card);

  return {
    id: card.id,
    name: card.name,
    category: tcgdxCategoryToDeck(card.category),
    setCode,
    number,
    image,
  };
}

export async function searchTcgdexCards(options: {
  query: string;
  type?: DeckTypeFilter;
  format?: DeckFormat;
}): Promise<CardSearchResult[]> {
  const q = options.query.trim();
  if (q.length < 1) return [];

  const url = new URL(`${TCGDEX_BASE}/cards`);
  url.searchParams.set("name", q);
  const cat = categoryParam(options.type ?? "all");
  if (cat) url.searchParams.set("category", cat);

  const briefs = await fetchJson<TcgdexBrief[]>(url.toString());
  if (!briefs?.length) return [];

  const format = options.format ?? "standard";
  const slice = briefs.slice(0, MAX_RESULTS);

  const fullCards = await Promise.all(
    slice.map((b) => fetchJson<TcgdexFull>(`${TCGDEX_BASE}/cards/${b.id}`))
  );

  const filtered = fullCards.filter(
    (c): c is TcgdexFull => c != null && passesFormat(c, format)
  );

  const enriched = filtered.map((c) => enrichCardImage(c, filtered));

  const results = enriched
    .map(briefToResult)
    .sort((a, b) => scoreResult(b) - scoreResult(a));

  return filterRedundantWithoutImage(results).slice(0, 24);
}

function scoreResult(card: CardSearchResult): number {
  let score = 0;
  if (card.image) score += 4;
  if (card.setCode) score += 2;
  if (card.number) score += 1;
  return score;
}

/** Oculta promos sin imagen si ya hay otra impresión con el mismo nombre. */
function filterRedundantWithoutImage(cards: CardSearchResult[]): CardSearchResult[] {
  const namesWithImage = new Set(
    cards.filter((c) => c.image).map((c) => c.name.trim().toLowerCase())
  );
  return cards.filter(
    (c) => c.image || !namesWithImage.has(c.name.trim().toLowerCase())
  );
}
