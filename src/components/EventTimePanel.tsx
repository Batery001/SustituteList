import { StoreClock } from "@/components/StoreClock";
import { formatDeadline, getTimezoneLabel } from "@/lib/event-utils";

interface EventTimePanelProps {
  eventName: string;
  eventTypeLabel?: string;
  deadline: Date;
  timeZone: string;
  canSubmit: boolean;
}

export function EventTimePanel({
  eventName,
  eventTypeLabel,
  deadline,
  timeZone,
  canSubmit,
}: EventTimePanelProps) {
  const deadlineLabel = formatDeadline(deadline, timeZone);
  const tzLabel = getTimezoneLabel(timeZone);

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
          <span className="text-zinc-500"> ({tzLabel})</span>
        </p>
        {!canSubmit ? (
          <p className="mt-2 font-medium text-amber-400">
            Envío de listas cerrado
          </p>
        ) : (
          <p className="mt-2 text-emerald-400/90">Envío abierto</p>
        )}
      </div>
      <StoreClock timeZone={timeZone} />
    </div>
  );
}
