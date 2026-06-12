/** Estados canónicos para nuevos torneos. */
export const EVENT_DB_STATUSES = ["draft", "open", "closed", "archived"] as const;
export type EventDbStatus = (typeof EVENT_DB_STATUSES)[number];

/** Valores legacy en BD que equivalen a torneo abierto. */
export const LEGACY_OPEN_STATUSES = ["open", "Active"] as const;

/** Valores legacy que equivalen a torneo cerrado. */
export const LEGACY_CLOSED_STATUSES = ["closed", "Finished"] as const;

export const OPEN_EVENT_STATUSES = [...LEGACY_OPEN_STATUSES] as const;

/** Normaliza cualquier valor de BD a un estado canónico. */
export function normalizeEventStatus(raw: string): EventDbStatus {
  const s = raw.trim();
  if (s === "Draft" || s === "draft") return "draft";
  if ((LEGACY_OPEN_STATUSES as readonly string[]).includes(s)) return "open";
  if (s === "archived") return "archived";
  if ((LEGACY_CLOSED_STATUSES as readonly string[]).includes(s)) return "closed";
  return "closed";
}

export function isEventOpen(status: string): boolean {
  return normalizeEventStatus(status) === "open";
}

export function isEventDraft(status: string): boolean {
  return normalizeEventStatus(status) === "draft";
}

/** Consulta MongoDB que incluye valores legacy abiertos. */
export const OPEN_EVENT_QUERY = { status: { $in: [...OPEN_EVENT_STATUSES] } };

/** Estado canónico al crear o cerrar torneos. */
export const EVENT_STATUS = {
  draft: "draft",
  open: "open",
  closed: "closed",
  archived: "archived",
} as const satisfies Record<EventDbStatus, EventDbStatus>;
