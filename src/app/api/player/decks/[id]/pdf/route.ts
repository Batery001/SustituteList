import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { toStoredParsedCards } from "@/lib/deckParser";
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
  request: Request,
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
    const cards = toStoredParsedCards(parsed.cards);
    const updatedAt = deck.updatedAt ? new Date(deck.updatedAt) : new Date();
    const etag = `"player-deck-${deck._id.toString()}-${updatedAt.getTime()}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      });
    }

    const pdfData = {
      eventName: deck.name,
      playerName: player.playerName,
      popId: player.popId,
      division: getDivision(player.birthDate),
      cards,
      rawText: deck.rawText,
      categories: parsed.categories,
      cardCount: parsed.cardCount,
      updatedAt,
    };

    const buffer = generateDecklistPdfBuffer(pdfData);
    const filename = decklistPdfFilename(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ETag: etag,
        "Last-Modified": updatedAt.toUTCString(),
      },
    });
  } catch (err) {
    console.error("Generate player deck PDF error:", err);
    return NextResponse.json({ error: msg.api.serverError }, { status: 500 });
  }
}
