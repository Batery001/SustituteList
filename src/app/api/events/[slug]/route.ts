import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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
  const canSubmit = event.status === "open" && !deadlinePassed;
  const entryFeeCents =
    event.entryFeeCents ?? store?.defaultEntryFeeCents ?? 0;

  const onlinePaymentsAvailable =
    entryFeeCents > 0 &&
    store?.onlinePaymentsEnabled !== false &&
    isTransbankConfigured(store);

  const playerId = await getPlayerId();
  let myRegistration: {
    accessToken: string;
    paymentStatus: string;
    deckEditToken: string | null;
  } | null = null;

  if (playerId) {
    const reg = await Registration.findOne({
      eventId: event._id,
      playerId,
    }).lean();
    if (reg) {
      let deckEditToken: string | null = null;
      if (reg.decklistSubmissionId) {
        const sub = await DecklistSubmission.findById(
          reg.decklistSubmissionId
        ).lean();
        deckEditToken = sub?.editToken ?? null;
      }
      myRegistration = {
        accessToken: reg.accessToken,
        paymentStatus: reg.paymentStatus,
        deckEditToken,
      };
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
    onlinePaymentsAvailable,
  });
}
