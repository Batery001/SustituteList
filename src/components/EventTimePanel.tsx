import type { ReactNode } from "react";
import { DeadlineCountdown } from "@/components/DeadlineCountdown";
import { StoreClock } from "@/components/StoreClock";
import { formatDeadline, getTimezoneLabel } from "@/lib/event-utils";

interface EventTimePanelProps {
  eventName: string;
  eventTypeLabel?: string;
  deadline: Date;
  timeZone: string;
  canSubmit: boolean;
  /** Contenido extra bajo la cuenta atrás (ej. botón copiar enlace). */
  footer?: ReactNode;
}

export function EventTimePanel({
  eventName,
  eventTypeLabel,
  deadline,
  timeZone,
  canSubmit,
  footer,
}: EventTimePanelProps) {
  const deadlineLabel = formatDeadline(deadline, timeZone);
  const tzLabel = getTimezoneLabel(timeZone);
  const deadlineIso = deadline.toISOString();

  return (
    <div className="mb-6 flex gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="min-w-0 flex-1 text-sm text-zinc-400">
        {eventTypeLabel && (
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-500/90">
            {eventTypeLabel}
          </p>
        )}
        <p className="truncate font-semibold text-zinc-100">{eventName}</p>
        <p className="mt-2">
          <span className="text-zinc-300">Hora límite:</span>{" "}
          <span className="text-zinc-200">{deadlineLabel}</span>
          <span className="text-zinc-500">
            {" "}
            (zona: {tzLabel}
            {timeZone !== tzLabel ? ` · ${timeZone}` : ""})
          </span>
        </p>

        <DeadlineCountdown deadlineIso={deadlineIso} closed={!canSubmit} />

        {footer}
      </div>
      <StoreClock timeZone={timeZone} />
    </div>
  );
}
