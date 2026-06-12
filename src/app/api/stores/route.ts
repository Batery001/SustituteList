import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export async function GET() {
  await connectDB();

  const stores = await Store.find({ slug: { $exists: true, $ne: "" } })
    .sort({ name: 1 })
    .lean();

  const openEvents = await Event.find(OPEN_EVENT_QUERY)
    .sort({ startsAt: 1 })
    .lean();

  const eventsByStore = new Map<string, typeof openEvents>();
  for (const ev of openEvents) {
    const key = ev.storeId.toString();
    const list = eventsByStore.get(key) ?? [];
    list.push(ev);
    eventsByStore.set(key, list);
  }

  return NextResponse.json({
    stores: stores.map((s) => ({
      _id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      city: s.city ?? "",
      description: s.description ?? "",
      openEvents: (eventsByStore.get(s._id.toString()) ?? []).map((e) => ({
        name: e.name,
        slug: e.slug,
        type: e.type,
        startsAt: e.startsAt,
      })),
    })),
  });
}
