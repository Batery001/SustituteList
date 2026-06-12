import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { toStoredParsedCards } from "@/lib/deckParser";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import { serializeValidation } from "@/lib/validation-display";
import { PlayerDeck } from "@/models/PlayerDeck";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const deck = await PlayerDeck.findOne({ _id: id, playerId }).lean();
  if (!deck) {
    return NextResponse.json({ error: msg.api.deckNotFound }, { status: 404 });
  }

  return NextResponse.json({
    deck: {
      _id: deck._id.toString(),
      name: deck.name,
      rawText: deck.rawText,
      validation: serializeValidation(deck.validation),
      updatedAt: deck.updatedAt,
    },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { name, rawText } = (await request.json()) as {
      name?: string;
      rawText?: string;
    };

    await connectDB();
    const deck = await PlayerDeck.findOne({ _id: id, playerId });
    if (!deck) {
      return NextResponse.json({ error: msg.api.deckNotFound }, { status: 404 });
    }

    if (name?.trim()) deck.name = name.trim();

    if (rawText?.trim()) {
      const parsed = await parseAndEnrichPokemonDecklist(rawText);
      deck.set({
        rawText: rawText.trim(),
        parsedCards: toStoredParsedCards(parsed.cards),
        validation: {
          cardCount: parsed.cardCount,
          errorMessages: parsed.errors,
          warnings: parsed.warnings,
        },
      });
    }

    await deck.save();

    return NextResponse.json({
      deck: {
        _id: deck._id.toString(),
        name: deck.name,
        rawText: deck.rawText,
        validation: serializeValidation(deck.validation),
        updatedAt: deck.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update deck error:", err);
    return NextResponse.json({ error: msg.api.deckSaveFailed }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();

  const result = await PlayerDeck.deleteOne({ _id: id, playerId });
  if (result.deletedCount === 0) {
    return NextResponse.json({ error: msg.api.deckNotFound }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
