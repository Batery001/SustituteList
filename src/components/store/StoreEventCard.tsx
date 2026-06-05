import Link from "next/link";
import type { StoreEventSummary } from "@/types/store-dashboard";
import {
  eventTypeLabel,
  formatEventDate,
  formatPriceCLP,
  statusBadgeClass,
} from "@/lib/events/store-event-utils";

export function StoreEventCard({ event }: { event: StoreEventSummary }) {
  const spots =
    event.maxPlayers != null && event.maxPlayers > 0
      ? `${event.registrationCount}/${event.maxPlayers}`
      : `${event.registrationCount}`;

  return (
    <Link
      href={`/dashboard/store/events/${event.id}`}
      className="sub-panel block rounded-xl p-4 transition-colors hover:border-sky-400/35"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-sky-50">{event.title}</h3>
          <p className="mt-1 text-xs text-sky-100/50">
            {eventTypeLabel(event.type)} · {formatPriceCLP(event.price)}
          </p>
          <p className="mt-2 text-sm text-sky-200/80">{formatEventDate(event.date)}</p>
        </div>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-medium ${statusBadgeClass(event.status)}`}
        >
          {event.status}
        </span>
      </div>
      <p className="mt-3 text-xs text-sky-100/45">
        Inscritos: <span className="text-sky-200">{spots}</span>
      </p>
    </Link>
  );
}
