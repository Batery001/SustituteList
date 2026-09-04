import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { connectDB } from "@/lib/db";
import {
  decklistPdfFilename,
  generateDecklistPdfBuffer,
} from "@/lib/decklist-pdf";
import { getDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";
import { PlayerDeck } from "@/models/PlayerDeck";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const playerId = await getPlayerId();
    if (!playerId) {
      return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
    }

    const { id } = await params;
    if (!id?.trim()) {
      return NextResponse.json({ error: msg.api.deckNotFound }, { status: 400 });
    }

    await connectDB();

    const [deck, player] = await Promise.all([
      PlayerDeck.findOne({ _id: id, playerId }).lean(),
      Player.findById(playerId).select("playerName popId birthDate").lean(),
    ]);

    if (!deck) {
      return NextResponse.json({ error: msg.api.deckNotFound }, { status: 404 });
    }
    if (!player) {
      return NextResponse.json({ error: msg.api.playerNotFound }, { status: 404 });
    }

    const parsed = await parseAndEnrichPokemonDecklist(deck.rawText ?? "");

    const pdfData = {
      eventName: deck.name,
      playerName: player.playerName,
      popId: player.popId,
      division: getDivision(player.birthDate),
      cards: (deck.parsedCards ?? []).map((c) => ({
        qty: c.qty ?? 0,
        name: c.name ?? "",
        setCode: c.setCode ?? undefined,
        number: c.number ?? undefined,
        category: c.category ?? undefined,
      })),
      rawText: deck.rawText,
      categories: parsed.categories,
      cardCount: deck.validation?.cardCount ?? parsed.cardCount ?? 0,
      updatedAt: deck.updatedAt,
    };

    const buffer = generateDecklistPdfBuffer(pdfData);
    const filename = decklistPdfFilename(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("Generate player deck PDF error:", err);
    return NextResponse.json({ error: msg.api.serverError }, { status: 500 });
  }
}
