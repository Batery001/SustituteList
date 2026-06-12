import { dbConnect } from "@/lib/dbConnect";
import { EVENT_STATUS, OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import {
  getStoreTimezone,
  parseDateTimeLocalInTimeZone,
  slugify,
} from "@/lib/event-utils";
import { syncStoreTimezone } from "@/lib/sync-store-timezone";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";
import type { CreateEventPayload } from "@/types/store-dashboard";

export class CreateEventError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "CreateEventError";
  }
}

export async function createStoreEvent(
  storeId: string,
  input: CreateEventPayload
) {
  const {
    title,
    type,
    startsAt,
    decklistDeadlineAt,
    maxPlayers,
    price,
    clientTimeZone,
  } = input;

  if (!title?.trim()) {
    throw new CreateEventError("El título es obligatorio", 400);
  }
  if (!startsAt || !decklistDeadlineAt) {
    throw new CreateEventError("Las fechas son obligatorias", 400);
  }

  await dbConnect();

  const store = await Store.findById(storeId);
  if (!store) {
    throw new CreateEventError("Tienda no encontrada", 404);
  }

  await syncStoreTimezone(storeId);
  const tz = clientTimeZone?.trim() || getStoreTimezone(store.timezone);
  const starts = parseDateTimeLocalInTimeZone(startsAt, tz);
  const deadline = parseDateTimeLocalInTimeZone(decklistDeadlineAt, tz);
  const now = new Date();

  if (Number.isNaN(starts.getTime()) || Number.isNaN(deadline.getTime())) {
    throw new CreateEventError("Fecha u hora no válida", 400);
  }

  if (starts <= now) {
    throw new CreateEventError("La fecha del torneo debe ser futura", 400);
  }

  if (deadline <= now) {
    throw new CreateEventError(
      "El límite de decklist debe ser una fecha futura",
      400
    );
  }

  if (deadline >= starts) {
    throw new CreateEventError(
      "El límite de decklist debe ser anterior al inicio del torneo",
      400
    );
  }

  await Event.updateMany(
    { storeId, ...OPEN_EVENT_QUERY },
    { $set: { status: EVENT_STATUS.closed } }
  );

  let slug = slugify(title.trim());
  if (!slug) slug = `torneo-${Date.now().toString(36)}`;
  if (await Event.findOne({ slug })) {
    slug = `${slug}-${Date.now().toString(36)}`;
  }

  const fee =
    typeof price === "number" && price >= 0
      ? Math.round(price)
      : store.defaultEntryFeeCents ?? 0;

  const event = await Event.create({
    storeId,
    name: title.trim(),
    type: type ?? "challenge",
    slug,
    startsAt: starts,
    decklistDeadlineAt: deadline,
    status: EVENT_STATUS.open,
    entryFeeCents: fee,
    price: fee,
    maxPlayers:
      typeof maxPlayers === "number" && maxPlayers > 0
        ? Math.round(maxPlayers)
        : null,
  });

  return event;
}
