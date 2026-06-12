import { NextResponse } from "next/server";
import type { DeckFormat, DeckTypeFilter } from "@/lib/deck-builder";
import { searchTcgdexCards } from "@/lib/card-lookup/tcgdex-search";
import { msg } from "@/lib/messages";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const SEARCH_LIMIT = 60;
const SEARCH_WINDOW_MS = 60_000;

function parseType(value: string | null): DeckTypeFilter {
  if (value === "pokemon" || value === "trainer" || value === "energy") {
    return value;
  }
  return "all";
}

function parseFormat(value: string | null): DeckFormat {
  if (value === "expanded" || value === "glc") return value;
  return "standard";
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`cards-search:${ip}`, SEARCH_LIMIT, SEARCH_WINDOW_MS)) {
    return NextResponse.json({ error: msg.api.rateLimited }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 1) {
    return NextResponse.json({ cards: [] });
  }

  try {
    const cards = await searchTcgdexCards({
      query: q,
      type: parseType(searchParams.get("type")),
      format: parseFormat(searchParams.get("format")),
    });
    return NextResponse.json({ cards });
  } catch (err) {
    console.error("Card search error:", err);
    return NextResponse.json({ error: msg.api.serverError }, { status: 500 });
  }
}
