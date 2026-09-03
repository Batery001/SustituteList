import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { EVENT_STATUS, isEventOpen } from "@/lib/events/event-status";
import { getStoreEventForStore } from "@/lib/events/get-store-events";
import { msg } from "@/lib/messages";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const event = await getStoreEventForStore(storeId, eventId);
    if (!event) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (err) {
    console.error("Store event detail error:", err);
    return NextResponse.json(
      { error: "No se pudo cargar el torneo" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { eventId } = await params;
  const body = (await request.json()) as { action?: string };

  try {
    await connectDB();
    const event = await Event.findOne({ _id: eventId, storeId });
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    if (body.action === "close") {
      event.status = EVENT_STATUS.closed;
    } else if (body.action === "reopen") {
      event.status = EVENT_STATUS.open;
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
    }

    await event.save();
    const summary = await getStoreEventForStore(storeId, eventId);
    return NextResponse.json({
      event: summary,
      open: isEventOpen(event.status),
    });
  } catch (err) {
    console.error("Store event patch error:", err);
    return NextResponse.json({ error: msg.api.eventCloseFailed }, { status: 500 });
  }
}
