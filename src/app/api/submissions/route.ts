import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { parseDecklist } from "@/lib/decklist-parser";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { isDeadlinePassed } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { serializeValidation } from "@/lib/validation-display";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";

export async function GET(request: Request) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) {
    return NextResponse.json({ error: msg.api.eventIdRequired }, { status: 400 });
  }

  await connectDB();

  const event = await Event.findOne({ _id: eventId, storeId });
  if (!event) {
    return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
  }

  const submissions = await DecklistSubmission.find({ eventId })
    .sort({ division: 1, playerName: 1 })
    .lean();

  const divisionOrder = { master: 0, senior: 1, junior: 2 };
  submissions.sort((a, b) => {
    const d =
      divisionOrder[a.division as keyof typeof divisionOrder] -
      divisionOrder[b.division as keyof typeof divisionOrder];
    if (d !== 0) return d;
    return a.playerName.localeCompare(b.playerName, "es");
  });

  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventSlug?: string;
      playerName?: string;
      popId?: string;
      birthDate?: string;
      rawText?: string;
    };

    const { eventSlug, playerName, popId, birthDate, rawText } = body;

    if (!eventSlug || !playerName || !popId || !birthDate || !rawText?.trim()) {
      return NextResponse.json(
        { error: msg.api.allFieldsRequired },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOne({ slug: eventSlug, status: "open" });
    if (!event) {
      return NextResponse.json(
        { error: msg.api.eventNotFoundOrClosed },
        { status: 404 }
      );
    }

    if (isDeadlinePassed(new Date(event.decklistDeadlineAt))) {
      return NextResponse.json(
        { error: msg.api.deadlinePassed },
        { status: 403 }
      );
    }

    const normalizedPopId = popId.trim();
    const existing = await DecklistSubmission.findOne({
      eventId: event._id,
      popId: normalizedPopId,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: msg.api.duplicatePopId,
          editToken: existing.editToken,
        },
        { status: 409 }
      );
    }

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return NextResponse.json({ error: msg.api.invalidBirthDate }, { status: 400 });
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

    const editToken = randomBytes(24).toString("hex");
    const division = getDivision(birth);

    const submission = await DecklistSubmission.create({
      eventId: event._id,
      playerName: playerName.trim(),
      popId: normalizedPopId,
      birthDate: birth,
      division,
      rawText: rawText.trim(),
      parsedCards: parsed.cards,
      validation: {
        cardCount: parsed.cardCount,
        errorMessages: parsed.errors,
        warnings: parsed.warnings,
      },
      editToken,
    });

    return NextResponse.json(
      {
        submission: {
          id: submission._id.toString(),
          editToken: submission.editToken,
          division: submission.division,
          validation: serializeValidation(submission.validation),
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Submission error:", err);
    return NextResponse.json({ error: msg.api.saveFailed }, { status: 500 });
  }
}
