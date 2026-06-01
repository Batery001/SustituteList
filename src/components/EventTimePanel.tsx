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
    <div className="sub-panel mb-6 flex gap-3 rounded-xl p-4">
      <div className="min-w-0 flex-1 text-sm text-sky-100/60">
        {eventTypeLabel && (
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
            {eventTypeLabel}
          </p>
        )}
        <p className="truncate font-semibold text-sky-50">{eventName}</p>
        <p className="mt-2">
          <span className="text-sky-200/80">Hora límite:</span>{" "}
          <span className="text-sky-100">{deadlineLabel}</span>
          <span className="text-sky-100/40">
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
