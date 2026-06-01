import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { isDeadlinePassed } from "@/lib/event-utils";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

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
      canSubmit: event.status === "open" && !deadlinePassed,
    },
    store: store
      ? { name: store.name, timezone: store.timezone }
      : { name: "League", timezone: "UTC" },
  });
}
