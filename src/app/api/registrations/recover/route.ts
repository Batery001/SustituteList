import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { datesOnSameDay } from "@/lib/dates";
import { connectDB } from "@/lib/db";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { msg } from "@/lib/messages";
import { isValidPopId, normalizePopId } from "@/lib/pop-id";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      eventSlug?: string;
      popId?: string;
      birthDate?: string;
    };

    if (!body.eventSlug || !body.popId?.trim() || !body.birthDate) {
      return NextResponse.json(
        { error: msg.api.allFieldsRequired },
        { status: 400 }
      );
    }

    if (!isValidPopId(body.popId)) {
      return NextResponse.json({ error: msg.api.invalidPopId }, { status: 400 });
    }

    await connectDB();

    const event = await Event.findOne({
      slug: body.eventSlug,
      ...OPEN_EVENT_QUERY,
    });
    if (!event) {
      return NextResponse.json(
        { error: msg.api.eventNotFoundOrClosed },
        { status: 404 }
      );
    }

    const popId = normalizePopId(body.popId);
    const inEvent = await Registration.find({ eventId: event._id });
    const registration =
      inEvent.find((row) => normalizePopId(row.popId) === popId) ?? null;

    if (!registration || !datesOnSameDay(registration.birthDate, body.birthDate)) {
      return NextResponse.json({ error: msg.api.recoverFailed }, { status: 404 });
    }

    if (registration.playerId) {
      return NextResponse.json(
        {
          error: msg.api.recoverNeedsAccount,
          code: "ACCOUNT_EXISTS",
          loginUrl: `${getAppUrl()}/auth/login?callbackUrl=${encodeURIComponent(`/e/${event.slug}`)}`,
        },
        { status: 409 }
      );
    }

    let deckEditToken: string | null = null;
    if (registration.decklistSubmissionId) {
      const sub = await DecklistSubmission.findById(
        registration.decklistSubmissionId
      )
        .select("editToken")
        .lean();
      deckEditToken = sub?.editToken ?? null;
    }

    return NextResponse.json({
      registration: {
        id: registration._id.toString(),
        accessToken: registration.accessToken,
        paymentStatus: registration.paymentStatus,
        division: registration.division,
        playerName: registration.playerName,
        popId: registration.popId,
      },
      deckEditToken,
    });
  } catch (err) {
    console.error("Recover registration error:", err);
    return NextResponse.json({ error: msg.api.registerFailed }, { status: 500 });
  }
}
