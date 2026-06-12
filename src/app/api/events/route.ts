import { dbConnect } from "@/lib/dbConnect";
import { getActivePublicEvents } from "@/lib/events/public-events";
import { getAdminStoreId } from "@/lib/auth";
import {
  getStoreTimezone,
  parseDateTimeLocalInTimeZone,
  slugify,
} from "@/lib/event-utils";
import { syncStoreTimezone } from "@/lib/sync-store-timezone";
import {
  EVENT_STATUS,
  isEventOpen,
  OPEN_EVENT_QUERY,
} from "@/lib/events/event-status";
import { msg } from "@/lib/messages";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";
import { NextResponse } from "next/server";

/** Cartelera pública de torneos activos (hub). */
async function getPublicEventsResponse() {
  const events = await getActivePublicEvents();
  return NextResponse.json({ events });
}

/** Panel admin de la tienda autenticada. */
async function getAdminEventsResponse() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  await dbConnect();

  const events = await Event.find({ storeId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const openEvent = events.find((e) => isEventOpen(e.status)) ?? null;
  const store = await Store.findById(storeId).lean();
  const storeTimezone = getStoreTimezone(store?.timezone);
  if (store && store.timezone !== storeTimezone) {
    await syncStoreTimezone(storeId);
  }

  return NextResponse.json({
    events,
    openEvent,
    storeTimezone,
    serverNowInStoreTz: new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "medium",
      timeZone: storeTimezone,
    }).format(new Date()),
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("scope") === "admin") {
    return getAdminEventsResponse();
  }

  try {
    return await getPublicEventsResponse();
  } catch (err) {
    console.error("Public events error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los torneos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      type?: "cup" | "challenge" | "local";
      startsAt?: string;
      decklistDeadlineAt?: string;
      slug?: string;
      entryFeeCents?: number;
      maxPlayers?: number;
      price?: number;
      clientTimeZone?: string;
    };

    const {
      name,
      type,
      startsAt,
      decklistDeadlineAt,
      slug: customSlug,
      clientTimeZone,
      entryFeeCents,
      maxPlayers,
      price,
    } = body;

    if (!name || !startsAt || !decklistDeadlineAt) {
      return NextResponse.json(
        { error: msg.api.nameDatesRequired },
        { status: 400 }
      );
    }

    await dbConnect();

    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: msg.api.storeNotFound }, { status: 404 });
    }

    await syncStoreTimezone(storeId);
    const tz = clientTimeZone?.trim() || getStoreTimezone(store.timezone);
    const starts = parseDateTimeLocalInTimeZone(startsAt, tz);
    const deadline = parseDateTimeLocalInTimeZone(decklistDeadlineAt, tz);

    if (Number.isNaN(starts.getTime()) || Number.isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: "Fecha u hora no válida" },
        { status: 400 }
      );
    }

    if (deadline >= starts) {
      return NextResponse.json(
        { error: msg.api.deadlineBeforeStart },
        { status: 400 }
      );
    }

    await Event.updateMany(
      { storeId, ...OPEN_EVENT_QUERY },
      { $set: { status: EVENT_STATUS.closed } }
    );

    let slug = customSlug ? slugify(customSlug) : slugify(name);
    const existing = await Event.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const fee =
      typeof entryFeeCents === "number"
        ? Math.max(0, Math.round(entryFeeCents))
        : store.defaultEntryFeeCents ?? 0;

    const event = await Event.create({
      storeId,
      name,
      type: type ?? "challenge",
      slug,
      startsAt: starts,
      decklistDeadlineAt: deadline,
      status: EVENT_STATUS.open,
      entryFeeCents: fee,
      maxPlayers:
        typeof maxPlayers === "number" ? Math.max(0, maxPlayers) : null,
      price: typeof price === "number" ? Math.max(0, price) : fee,
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: msg.api.createEventFailed }, { status: 500 });
  }
}
