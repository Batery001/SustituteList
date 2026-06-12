import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { toStoredParsedCards } from "@/lib/deckParser";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { isEventOpen } from "@/lib/events/event-status";
import { isDeadlinePassed } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { getPlayerRegistrationById } from "@/lib/player/get-player-registrations";
import { getPlayerId } from "@/lib/player-auth";
import { serializeValidation } from "@/lib/validation-display";
import mongoose from "mongoose";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      registrationId?: string;
      rawText?: string;
    };

    const { registrationId, rawText } = body;

    if (!registrationId || !rawText?.trim()) {
      return NextResponse.json(
        { error: msg.api.allFieldsRequired },
        { status: 400 }
      );
    }

    const summary = await getPlayerRegistrationById(playerId, registrationId);
    if (!summary) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
    }

    if (summary.paymentStatus !== "paid") {
      return NextResponse.json(
        { error: msg.api.paymentRequired, code: "PAYMENT_REQUIRED" },
        { status: 403 }
      );
    }

    if (!summary.canUploadDeck) {
      return NextResponse.json(
        {
          error: summary.deadlinePassed
            ? msg.api.deadlinePassed
            : msg.api.eventClosed,
        },
        { status: 403 }
      );
    }

    const parsed = await parseAndEnrichPokemonDecklist(rawText);
    if (!parsed.isValid) {
      return NextResponse.json(
        {
          error: msg.api.validationFailed,
          validation: {
            cardCount: parsed.cardCount,
            errors: parsed.errors,
            warnings: parsed.warnings,
          },
        },
        { status: 422 }
      );
    }

    await connectDB();

    const registration = await Registration.findOne({
      _id: registrationId,
      playerId: new mongoose.Types.ObjectId(playerId),
    });
    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
    }

    const event = await Event.findById(registration.eventId);
    if (!event || !isEventOpen(event.status)) {
      return NextResponse.json({ error: msg.api.eventClosed }, { status: 403 });
    }

    if (isDeadlinePassed(new Date(event.decklistDeadlineAt))) {
      return NextResponse.json({ error: msg.api.deadlinePassed }, { status: 403 });
    }

    const cardsForDb = toStoredParsedCards(parsed.cards);

    const existing = registration.decklistSubmissionId
      ? await DecklistSubmission.findById(registration.decklistSubmissionId)
      : await DecklistSubmission.findOne({
          eventId: event._id,
          popId: registration.popId,
        });

    if (existing) {
      existing.set({
        rawText: rawText.trim(),
        parsedCards: cardsForDb,
        validation: {
          cardCount: parsed.cardCount,
          errorMessages: parsed.errors,
          warnings: parsed.warnings,
        },
      });
      await existing.save();

      registration.decklistSubmissionId = existing._id;
      registration.decklist = rawText.trim();
      await registration.save();

      return NextResponse.json({
        ok: true,
        updated: true,
        submission: {
          id: existing._id.toString(),
          editToken: existing.editToken,
          validation: serializeValidation(existing.validation),
        },
      });
    }

    const editToken = randomBytes(24).toString("hex");
    const submission = await DecklistSubmission.create({
      eventId: event._id,
      registrationId: registration._id,
      playerName: registration.playerName,
      popId: registration.popId,
      birthDate: registration.birthDate,
      division: getDivision(registration.birthDate),
      rawText: rawText.trim(),
      parsedCards: cardsForDb,
      validation: {
        cardCount: parsed.cardCount,
        errorMessages: parsed.errors,
        warnings: parsed.warnings,
      },
      editToken,
    });

    registration.decklistSubmissionId = submission._id;
    registration.decklist = rawText.trim();
    await registration.save();

    return NextResponse.json(
      {
        ok: true,
        updated: false,
        submission: {
          id: submission._id.toString(),
          editToken: submission.editToken,
          validation: serializeValidation(submission.validation),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Upload deck error:", err);
    return NextResponse.json({ error: msg.api.saveFailed }, { status: 500 });
  }
}
