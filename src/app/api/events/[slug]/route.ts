import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isEventOpen } from "@/lib/events/event-status";
import { isDeadlinePassed } from "@/lib/event-utils";
import { getPlayerId } from "@/lib/player-auth";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Store } from "@/models/Store";
import { isTransbankConfigured } from "@/lib/transbank";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  await connectDB();

  const event = await Event.findOne({ slug }).lean();
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const store = await Store.findById(event.storeId).lean();
  const deadlinePassed = isDeadlinePassed(new Date(event.decklistDeadlineAt));
  const canSubmit = isEventOpen(event.status) && !deadlinePassed;
  const entryFeeCents =
    event.entryFeeCents ?? store?.defaultEntryFeeCents ?? 0;

  const onlinePaymentsAvailable =
    entryFeeCents > 0 &&
    store?.onlinePaymentsEnabled !== false &&
    isTransbankConfigured(store);

  const playerId = await getPlayerId();
  type MyRegRow = {
    accessToken: string;
    paymentStatus: string;
    deckEditToken: string | null;
    playerName: string;
    popId: string;
    familyMemberId: string | null;
  };
  let myRegistration: MyRegRow | null = null;
  const myRegistrations: MyRegRow[] = [];

  if (playerId) {
    const regs = await Registration.find({
      eventId: event._id,
      $or: [{ playerId }, { registeredByPlayerId: playerId }],
    }).lean();

    for (const reg of regs) {
      let deckEditToken: string | null = null;
      if (reg.decklistSubmissionId) {
        const sub = await DecklistSubmission.findById(
          reg.decklistSubmissionId
        ).lean();
        deckEditToken = sub?.editToken ?? null;
      }
      const row: MyRegRow = {
        accessToken: reg.accessToken,
        paymentStatus: reg.paymentStatus,
        deckEditToken,
        playerName: reg.playerName,
        popId: reg.popId,
        familyMemberId: reg.familyMemberId?.toString() ?? null,
      };
      myRegistrations.push(row);
      if (!myRegistration || reg.playerId?.toString() === playerId) {
        myRegistration = row;
      }
    }
  }

  return NextResponse.json({
    event: {
      id: event._id.toString(),
      name: event.name,
      type: event.type,
      slug: event.slug,
      status: event.status,
      startsAt: event.startsAt,
      decklistDeadlineAt: event.decklistDeadlineAt,
      deadlinePassed,
      canSubmit,
      entryFeeCents,
      allowedRegulationMarks: event.allowedRegulationMarks ?? [],
    },
    store: store
      ? {
          name: store.name,
          timezone: store.timezone,
          address: store.address,
          city: store.city,
          phone: store.phone,
        }
      : { name: "League", timezone: "UTC" },
    myRegistration,
    myRegistrations,
    onlinePaymentsAvailable,
  });
}
