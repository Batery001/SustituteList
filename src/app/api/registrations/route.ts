import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { isDeadlinePassed } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import { Event } from "@/models/Event";
import { Player } from "@/models/Player";
import { Registration } from "@/models/Registration";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Store } from "@/models/Store";

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

  const registrations = await Registration.find({ eventId })
    .sort({ division: 1, playerName: 1 })
    .lean();

  const divisionOrder = { master: 0, senior: 1, junior: 2 };
  registrations.sort((a, b) => {
    const d =
      divisionOrder[a.division as keyof typeof divisionOrder] -
      divisionOrder[b.division as keyof typeof divisionOrder];
    if (d !== 0) return d;
    return a.playerName.localeCompare(b.playerName, "es");
  });

  const submissionIds = registrations
    .map((r) => r.decklistSubmissionId)
    .filter((id): id is NonNullable<typeof id> => id != null);
  const submissions =
    submissionIds.length > 0
      ? await DecklistSubmission.find({ _id: { $in: submissionIds } }).lean()
      : [];
  const subMap = new Map(
    submissions.map((s) => [s._id.toString(), s])
  );

  return NextResponse.json({
    registrations: registrations.map((r) => {
      const sub = r.decklistSubmissionId
        ? subMap.get(r.decklistSubmissionId.toString())
        : null;
      return {
        _id: r._id.toString(),
        playerName: r.playerName,
        popId: r.popId,
        division: r.division,
        paymentStatus: r.paymentStatus,
        paidAt: r.paidAt,
        accessToken: r.accessToken,
        hasDecklist: Boolean(sub),
        deckEditToken: sub?.editToken,
        createdAt: r.createdAt,
      };
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventSlug?: string;
      playerName?: string;
      popId?: string;
      birthDate?: string;
    };

    const { eventSlug } = body;
    if (!eventSlug) {
      return NextResponse.json({ error: msg.api.allFieldsRequired }, { status: 400 });
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
        { error: msg.api.registrationClosed },
        { status: 403 }
      );
    }

    const playerId = await getPlayerId();
    let playerName = body.playerName?.trim();
    let popId = body.popId?.trim();
    let birth: Date;

    if (playerId) {
      const player = await Player.findById(playerId);
      if (!player) {
        return NextResponse.json({ error: msg.api.playerNotFound }, { status: 401 });
      }
      playerName = player.playerName;
      popId = player.popId;
      birth = player.birthDate;
    } else {
      if (!playerName || !popId || !body.birthDate) {
        return NextResponse.json(
          { error: msg.api.allFieldsRequired },
          { status: 400 }
        );
      }
      birth = new Date(body.birthDate);
      if (Number.isNaN(birth.getTime())) {
        return NextResponse.json({ error: msg.api.invalidBirthDate }, { status: 400 });
      }
    }

    const existing = await Registration.findOne({
      eventId: event._id,
      popId: popId!,
    });

    if (existing) {
      return NextResponse.json(
        {
          error: msg.api.duplicateRegistration,
          accessToken: existing.accessToken,
          paymentStatus: existing.paymentStatus,
        },
        { status: 409 }
      );
    }

    const accessToken = randomBytes(24).toString("hex");
    const division = getDivision(birth!);

    const store = await Store.findById(event.storeId);
    const entryFee =
      event.entryFeeCents ?? store?.defaultEntryFeeCents ?? 0;
    const isFree = entryFee <= 0;

    const registration = await Registration.create({
      eventId: event._id,
      playerId: playerId ? playerId : undefined,
      playerName: playerName!,
      popId: popId!,
      birthDate: birth!,
      division,
      paymentStatus: isFree ? "paid" : "pending",
      paidAt: isFree ? new Date() : undefined,
      accessToken,
    });

    return NextResponse.json(
      {
        registration: {
          id: registration._id.toString(),
          accessToken: registration.accessToken,
          paymentStatus: registration.paymentStatus,
          division: registration.division,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: msg.api.saveFailed }, { status: 500 });
  }
}
