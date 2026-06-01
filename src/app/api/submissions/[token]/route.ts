import { NextResponse } from "next/server";
import { parseDecklist } from "@/lib/decklist-parser";
import { connectDB } from "@/lib/db";
import { isDeadlinePassed } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { serializeValidation } from "@/lib/validation-display";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  await connectDB();

  const submission = await DecklistSubmission.findOne({ editToken: token }).lean();
  if (!submission) {
    return NextResponse.json({ error: msg.api.decklistNotFound }, { status: 404 });
  }

  const event = await Event.findById(submission.eventId).lean();
  if (!event) {
    return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
  }

  const store = await Store.findById(event.storeId).lean();
  const deadlinePassed = isDeadlinePassed(new Date(event.decklistDeadlineAt));

  return NextResponse.json({
    submission: {
      playerName: submission.playerName,
      popId: submission.popId,
      division: submission.division,
      rawText: submission.rawText,
      parsedCards: submission.parsedCards,
      validation: serializeValidation(submission.validation),
      updatedAt: submission.updatedAt,
    },
    event: {
      name: event.name,
      slug: event.slug,
      decklistDeadlineAt: event.decklistDeadlineAt,
      deadlinePassed,
      canEdit: event.status === "open" && !deadlinePassed,
    },
    store: store
      ? { name: store.name, timezone: store.timezone }
      : { timezone: "UTC" },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const { rawText } = (await request.json()) as { rawText?: string };

    if (!rawText?.trim()) {
      return NextResponse.json(
        { error: msg.api.decklistTextRequired },
        { status: 400 }
      );
    }

    await connectDB();

    const submission = await DecklistSubmission.findOne({ editToken: token });
    if (!submission) {
      return NextResponse.json({ error: msg.api.decklistNotFound }, { status: 404 });
    }

    const event = await Event.findById(submission.eventId);
    if (!event || event.status !== "open") {
      return NextResponse.json({ error: msg.api.eventClosed }, { status: 403 });
    }

    if (isDeadlinePassed(new Date(event.decklistDeadlineAt))) {
      return NextResponse.json({ error: msg.api.deadlinePassed }, { status: 403 });
    }

    const parsed = parseDecklist(rawText);
    if (parsed.errors.length > 0) {
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

    submission.set({
      rawText: rawText.trim(),
      parsedCards: parsed.cards,
      validation: {
        cardCount: parsed.cardCount,
        errorMessages: parsed.errors,
        warnings: parsed.warnings,
      },
    });
    await submission.save();

    return NextResponse.json({
      submission: {
        validation: serializeValidation(submission.validation),
        updatedAt: submission.updatedAt,
      },
    });
  } catch (err) {
    console.error("Update submission error:", err);
    return NextResponse.json({ error: msg.api.updateFailed }, { status: 500 });
  }
}
