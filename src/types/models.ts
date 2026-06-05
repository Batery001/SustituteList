export const USER_ROLES = ["PLAYER", "STORE", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const EVENT_TYPES = ["Cup", "Challenge", "Local"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ["Draft", "Active", "Finished"] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const REGISTRATION_STATUSES = ["Pending", "Paid"] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

/** Respuesta pública de la cartelera de torneos. */
export type PublicEventDTO = {
  id: string;
  title: string;
  slug: string;
  type: EventType;
  date: string;
  decklistDeadline: string;
  maxPlayers: number | null;
  price: number;
  status: EventStatus;
  store: {
    id: string;
    name: string;
    logoUrl: string | null;
    city: string;
    country: string;
    slug: string | null;
  };
};
