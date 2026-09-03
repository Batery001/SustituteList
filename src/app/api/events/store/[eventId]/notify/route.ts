import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { connectDB } from "@/lib/db";
import {
  isEmailConfigured,
  sendDeadlineReminderEmail,
  sendMissingListEmail,
} from "@/lib/email";
import { formatDeadline, getStoreTimezone } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Player } from "@/models/Player";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

type Kind = "missing-list" | "deadline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: msg.api.emailNotConfigured },
      { status: 503 }
    );
  }

  const { eventId } = await params;
  const body = (await request.json()) as {
    kind?: Kind;
    registrationId?: string;
  };

  if (body.kind !== "missing-list" && body.kind !== "deadline") {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  try {
    await connectDB();
    const event = await Event.findOne({ _id: eventId, storeId });
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    const store = await Store.findById(event.storeId).lean();
    const deadlineLabel = formatDeadline(
      new Date(event.decklistDeadlineAt),
      getStoreTimezone(store?.timezone)
    );

    let query: Record<string, unknown> = { eventId: event._id };
    if (body.registrationId) {
      query = { ...query, _id: body.registrationId };
    }

    const registrations = await Registration.find(query).lean();
    const playerIds = registrations
      .map((r) => r.playerId)
      .filter((id): id is NonNullable<typeof id> => id != null);
    const players =
      playerIds.length > 0
        ? await Player.find({ _id: { $in: playerIds } })
            .select("email")
            .lean()
        : [];
    const emailByPlayer = new Map(
      players.map((p) => [p._id.toString(), p.email])
    );

    const listIds = new Set(
      (
        await DecklistSubmission.find({ eventId: event._id })
          .select("_id")
          .lean()
      ).map((s) => s._id.toString())
    );

    const app = getAppUrl();
    let sent = 0;
    let skipped = 0;

    for (const r of registrations) {
      const email =
        r.email ||
        (r.playerId ? emailByPlayer.get(r.playerId.toString()) : undefined);
      if (!email) {
        skipped += 1;
        continue;
      }

      if (body.kind === "missing-list") {
        const hasList = Boolean(
          r.decklistSubmissionId &&
            listIds.has(r.decklistSubmissionId.toString())
        );
        if (hasList) {
          skipped += 1;
          continue;
        }
        const result = await sendMissingListEmail({
          to: email,
          playerName: r.playerName,
          eventName: event.name,
          deadlineLabel,
          manageUrl: `${app}/e/${event.slug}/mi-inscripcion/${r.accessToken}`,
        });
        if (result.ok) sent += 1;
        else skipped += 1;
        continue;
      }

      const result = await sendDeadlineReminderEmail({
        to: email,
        playerName: r.playerName,
        eventName: event.name,
        deadlineLabel,
        manageUrl: `${app}/e/${event.slug}/mi-inscripcion/${r.accessToken}`,
      });
      if (result.ok) sent += 1;
      else skipped += 1;
    }

    if (sent === 0) {
      return NextResponse.json({ error: msg.api.notifyNone, sent, skipped }, { status: 400 });
    }

    return NextResponse.json({ ok: true, sent, skipped });
  } catch (err) {
    console.error("Notify error:", err);
    return NextResponse.json({ error: msg.api.notifyFailed }, { status: 500 });
  }
}
