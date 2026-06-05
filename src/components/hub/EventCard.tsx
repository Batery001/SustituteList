import Link from "next/link";
import type { PublicEventDTO } from "@/types/models";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatPrice(amount: number) {
  if (amount <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function EventCard({ event }: { event: PublicEventDTO }) {
  return (
    <li className="sub-panel rounded-xl p-4">
      <div className="flex items-start gap-3">
        {event.store.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.store.logoUrl}
            alt=""
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-xs font-bold text-sky-300">
            {event.store.name.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <Link href={`/e/${event.slug}`} className="font-semibold text-sky-50">
            {event.title}
          </Link>
          <p className="mt-0.5 text-xs text-sky-100/50">
            {event.store.name}
            {event.store.city ? ` · ${event.store.city}` : ""}
          </p>
          <p className="mt-2 text-sm text-sky-200/80">{formatDate(event.date)}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-300">
              {event.type}
            </span>
            <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-300">
              {formatPrice(event.price)}
            </span>
            {event.maxPlayers != null && event.maxPlayers > 0 && (
              <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-sky-300">
                Máx. {event.maxPlayers}
              </span>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
