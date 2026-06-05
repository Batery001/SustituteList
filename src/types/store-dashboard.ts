import type { Division } from "@/lib/division";
import type { EventStatus, EventType } from "@/types/models";

export type StoreEventSummary = {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  date: string;
  decklistDeadline: string;
  maxPlayers: number | null;
  registrationCount: number;
  status: EventStatus;
  price: number;
};

export type StoreRegistrationRow = {
  id: string;
  playerName: string;
  popId: string;
  division: Division;
  paymentStatus: string;
  hasDecklist: boolean;
  playerEmail?: string;
};

export type CreateEventPayload = {
  title: string;
  type: "cup" | "challenge" | "local";
  startsAt: string;
  decklistDeadlineAt: string;
  maxPlayers?: number;
  price?: number;
  clientTimeZone?: string;
};
