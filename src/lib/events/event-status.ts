export const OPEN_EVENT_STATUSES = ["open", "Active"] as const;

export function isEventOpen(status: string): boolean {
  return (OPEN_EVENT_STATUSES as readonly string[]).includes(status);
}

export const OPEN_EVENT_QUERY = { status: { $in: [...OPEN_EVENT_STATUSES] } };
