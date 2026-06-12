import { NextResponse } from "next/server";
import { parsePokemonDecklist, toStoredParsedCards } from "@/lib/deckParser";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import { serializeValidation } from "@/lib/validation-display";
import { PlayerDeck } from "@/models/PlayerDeck";

export async function GET() {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  await connectDB();
  const decks = await PlayerDeck.find({ playerId })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({
    decks: decks.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      cardCount: d.validation?.cardCount ?? 0,
      isValid: (d.validation?.errorMessages?.length ?? 0) === 0,
      updatedAt: d.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const { name, rawText } = (await request.json()) as {
      name?: string;
      rawText?: string;
    };

    if (!name?.trim() || !rawText?.trim()) {
      return NextResponse.json(
        { error: msg.api.deckNameAndListRequired },
        { status: 400 }
      );
    }

    await connectDB();

    const parsed = parsePokemonDecklist(rawText);
    const deck = await PlayerDeck.create({
      playerId,
      name: name.trim(),
      rawText: rawText.trim(),
      parsedCards: toStoredParsedCards(parsed.cards),
      validation: {
        cardCount: parsed.cardCount,
        errorMessages: parsed.errors,
        warnings: parsed.warnings,
      },
    });

    return NextResponse.json(
      {
        deck: {
          _id: deck._id.toString(),
          name: deck.name,
          rawText: deck.rawText,
          validation: serializeValidation(deck.validation),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Create deck error:", err);
    return NextResponse.json({ error: msg.api.deckSaveFailed }, { status: 500 });
  }
}
