import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { parseDecklist } from "@/lib/decklist-parser";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { isDeadlinePassed } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { serializeValidation } from "@/lib/validation-display";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { getPlayerId } from "@/lib/player-auth";

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
      registrationAccessToken?: string;
    };

    const {
      eventSlug,
      playerName,
      popId,
      birthDate,
      rawText,
      registrationAccessToken,
    } = body;

    if (!eventSlug || !rawText?.trim()) {
      return NextResponse.json(
        { error: msg.api.allFieldsRequired },
        { status: 400 }
      );
    }

    await connectDB();

    const event = await Event.findOne({ slug: eventSlug, ...OPEN_EVENT_QUERY });
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

    let registration = registrationAccessToken
      ? await Registration.findOne({
          eventId: event._id,
          accessToken: registrationAccessToken,
        })
      : null;

    if (!registration) {
      const playerId = await getPlayerId();
      const lookupPopId = popId?.trim();
      if (playerId) {
        registration = await Registration.findOne({
          eventId: event._id,
          playerId,
        });
      } else if (lookupPopId) {
        registration = await Registration.findOne({
          eventId: event._id,
          popId: lookupPopId,
        });
      }
    }

    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationRequired, code: "REGISTRATION_REQUIRED" },
        { status: 403 }
      );
    }

    if (registration.paymentStatus !== "paid") {
      return NextResponse.json(
        {
          error: msg.api.paymentRequired,
          code: "PAYMENT_REQUIRED",
          accessToken: registration.accessToken,
        },
        { status: 403 }
      );
    }

    const normalizedPopId = registration.popId;
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

    const birth = registration.birthDate;
    const resolvedName = registration.playerName;

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
      registrationId: registration._id,
      playerName: resolvedName,
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

    registration.decklistSubmissionId = submission._id;
    await registration.save();

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
