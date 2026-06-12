import { NextResponse } from "next/server";
import { parsePokemonDecklist } from "@/lib/deckParser";
import { msg } from "@/lib/messages";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const PARSE_LIMIT = 30;
const PARSE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!rateLimit(`parse:${ip}`, PARSE_LIMIT, PARSE_WINDOW_MS)) {
    return NextResponse.json({ error: msg.api.rateLimited }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { rawText?: string };
    const rawText = typeof body.rawText === "string" ? body.rawText : "";
    const result = parsePokemonDecklist(rawText);
    return NextResponse.json({
      cards: result.cards,
      errors: result.errors,
      warnings: result.warnings,
      cardCount: result.cardCount,
      categories: result.categories,
      isValid: result.isValid,
    });
  } catch (err) {
    console.error("Parse decklist error:", err);
    return NextResponse.json({ error: msg.api.parseFailed }, { status: 400 });
  }
}
