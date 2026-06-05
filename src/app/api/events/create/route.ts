import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import {
  CreateEventError,
  createStoreEvent,
} from "@/lib/events/create-store-event";
import type { CreateEventPayload } from "@/types/store-dashboard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as CreateEventPayload & {
      name?: string;
    };

    const payload: CreateEventPayload = {
      title: body.title ?? body.name ?? "",
      type: body.type ?? "challenge",
      startsAt: body.startsAt,
      decklistDeadlineAt: body.decklistDeadlineAt,
      maxPlayers: body.maxPlayers,
      price: body.price,
        clientTimeZone: body.clientTimeZone,
    };

    const event = await createStoreEvent(storeId, payload);

    return NextResponse.json(
      {
        ok: true,
        event: {
          id: event._id.toString(),
          slug: event.slug,
          title: event.name,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof CreateEventError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Create event error:", err);
    return NextResponse.json(
      { error: "No se pudo crear el torneo" },
      { status: 500 }
    );
  }
}
