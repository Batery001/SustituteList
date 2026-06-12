import { normalizeEventStatus } from "@/lib/events/event-status";
import type { EventStatus, EventType } from "@/types/models";

export function mapEventStatus(raw: string): EventStatus {
  const normalized = normalizeEventStatus(raw);
  if (normalized === "open") return "Active";
  if (normalized === "draft") return "Draft";
  return "Finished";
}

export function mapEventType(raw: string): EventType {
  const n = raw.toLowerCase();
  if (n === "cup") return "Cup";
  if (n === "local") return "Local";
  return "Challenge";
}

export function eventTypeLabel(type: EventType): string {
  const labels: Record<EventType, string> = {
    Cup: "League Cup",
    Challenge: "League Challenge",
    Local: "Torneo Local",
  };
  return labels[type];
}

export function statusBadgeClass(status: EventStatus): string {
  if (status === "Active") return "bg-emerald-500/15 text-emerald-300";
  if (status === "Draft") return "bg-sky-500/15 text-sky-300";
  return "bg-slate-500/15 text-slate-400";
}

export function formatEventDate(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatPriceCLP(amount: number) {
  if (amount <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}
