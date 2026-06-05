import { headers } from "next/headers";
import type { PublicEventDTO, EventStatus, EventType } from "@/types/models";
import { dbConnect } from "@/lib/dbConnect";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { Event } from "@/models/Event";
import type { IStore } from "@/models/Store";

function mapEventStatus(raw: string): EventStatus {
  if (raw === "Active" || raw === "open") return "Active";
  if (raw === "Draft") return "Draft";
  return "Finished";
}

function mapEventType(raw: string): EventType {
  const normalized = raw.toLowerCase();
  if (normalized === "cup") return "Cup";
  if (normalized === "local") return "Local";
  return "Challenge";
}

type PopulatedEvent = {
  _id: { toString(): string };
  name: string;
  slug: string;
  type: string;
  startsAt: Date;
  decklistDeadlineAt: Date;
  maxPlayers?: number | null;
  price?: number | null;
  entryFeeCents?: number;
  status: string;
  storeId: IStore & { _id: { toString(): string } };
};

function serializePublicEvent(event: PopulatedEvent): PublicEventDTO {
  const store = event.storeId;
  return {
    id: event._id.toString(),
    title: event.name,
    slug: event.slug,
    type: mapEventType(event.type),
    date: event.startsAt.toISOString(),
    decklistDeadline: event.decklistDeadlineAt.toISOString(),
    maxPlayers: event.maxPlayers ?? null,
    price: event.price ?? event.entryFeeCents ?? 0,
    status: mapEventStatus(event.status),
    store: {
      id: store._id.toString(),
      name: store.name,
      logoUrl: store.logoUrl || null,
      city: store.city ?? "",
      country: store.country ?? "Chile",
      slug: store.slug ?? null,
    },
  };
}

export async function getActivePublicEvents(): Promise<PublicEventDTO[]> {
  await dbConnect();

  const events = await Event.find(OPEN_EVENT_QUERY)
    .sort({ startsAt: 1 })
    .populate<{ storeId: IStore }>("storeId")
    .lean();

  return events
    .filter((e) => e.storeId && typeof e.storeId === "object")
    .map((e) =>
      serializePublicEvent(e as unknown as PopulatedEvent)
    );
}

export async function getServerBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function fetchPublicEventsFromApi(): Promise<PublicEventDTO[]> {
  try {
    const base = await getServerBaseUrl();
    const res = await fetch(`${base}/api/events`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: PublicEventDTO[] };
    return data.events ?? [];
  } catch {
    return [];
  }
}
