import { dbConnect } from "@/lib/dbConnect";
import {
  mapEventStatus,
  mapEventType,
} from "@/lib/events/store-event-utils";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import type { StoreEventSummary } from "@/types/store-dashboard";
import mongoose from "mongoose";

export async function getStoreEventsSummary(
  storeId: string
): Promise<StoreEventSummary[]> {
  await dbConnect();

  const storeObjectId = new mongoose.Types.ObjectId(storeId);
  const events = await Event.find({ storeId: storeObjectId })
    .sort({ startsAt: -1 })
    .lean();

  if (events.length === 0) return [];

  const eventIds = events.map((e) => e._id);
  const counts = await Registration.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
    { $match: { eventId: { $in: eventIds } } },
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
  ]);

  const countMap = new Map(
    counts.map((c) => [c._id.toString(), c.count])
  );

  return events.map((e) => ({
    id: e._id.toString(),
    title: e.name,
    slug: e.slug,
    type: mapEventType(e.type),
    date: e.startsAt.toISOString(),
    decklistDeadline: e.decklistDeadlineAt.toISOString(),
    maxPlayers: e.maxPlayers ?? null,
    registrationCount: countMap.get(e._id.toString()) ?? 0,
    status: mapEventStatus(e.status),
    price: e.price ?? e.entryFeeCents ?? 0,
  }));
}

export async function getStoreEventForStore(
  storeId: string,
  eventId: string
): Promise<StoreEventSummary | null> {
  await dbConnect();

  if (!mongoose.Types.ObjectId.isValid(eventId)) return null;

  const event = await Event.findOne({
    _id: eventId,
    storeId,
  }).lean();

  if (!event) return null;

  const registrationCount = await Registration.countDocuments({
    eventId: event._id,
  });

  return {
    id: event._id.toString(),
    title: event.name,
    slug: event.slug,
    type: mapEventType(event.type),
    date: event.startsAt.toISOString(),
    decklistDeadline: event.decklistDeadlineAt.toISOString(),
    maxPlayers: event.maxPlayers ?? null,
    registrationCount,
    status: mapEventStatus(event.status),
    price: event.price ?? event.entryFeeCents ?? 0,
  };
}
