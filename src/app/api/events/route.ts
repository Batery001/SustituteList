import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import {
  getStoreTimezone,
  parseDateTimeLocalInTimeZone,
  slugify,
} from "@/lib/event-utils";
import { syncStoreTimezone } from "@/lib/sync-store-timezone";
import { msg } from "@/lib/messages";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export async function GET() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  await connectDB();

  const events = await Event.find({ storeId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  const openEvent = events.find((e) => e.status === "open") ?? null;
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
      /** Zona del navegador al crear (ej. America/Santiago). */
      clientTimeZone?: string;
    };

    const {
      name,
      type,
      startsAt,
      decklistDeadlineAt,
      slug: customSlug,
      clientTimeZone,
    } = body;

    if (!name || !startsAt || !decklistDeadlineAt) {
      return NextResponse.json(
        { error: msg.api.nameDatesRequired },
        { status: 400 }
      );
    }

    await connectDB();

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
      { storeId, status: "open" },
      { $set: { status: "closed" } }
    );

    let slug = customSlug ? slugify(customSlug) : slugify(name);
    const existing = await Event.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const event = await Event.create({
      storeId,
      name,
      type: type ?? "challenge",
      slug,
      startsAt: starts,
      decklistDeadlineAt: deadline,
      status: "open",
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (err) {
    console.error("Create event error:", err);
    return NextResponse.json({ error: msg.api.createEventFailed }, { status: 500 });
  }
}
