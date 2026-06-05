"use client";

import { useEffect, useState } from "react";
import { getTimezoneLabel } from "@/lib/event-utils";

interface StoreClockProps {
  timeZone: string;
  compact?: boolean;
}

export function StoreClock({ timeZone, compact = false }: StoreClockProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div
        className={`animate-pulse rounded-xl bg-sky-950/50 ${compact ? "h-14 w-20" : "h-[88px] w-28"}`}
        aria-hidden
      />
    );
  }

  const time = new Intl.DateTimeFormat("es-CL", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const date = new Intl.DateTimeFormat("es-CL", {
    timeZone,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);

  const tz = getTimezoneLabel(timeZone);

  return (
    <div
      className="flex shrink-0 flex-col items-center justify-center rounded-xl border border-sky-400/35 bg-gradient-to-b from-[#0c1628] to-[#060b12] px-3 py-2.5 shadow-[0_0_24px_rgba(56,189,248,0.15)]"
      aria-live="polite"
      aria-label={`Hora actual: ${time}, ${tz}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-400/90">
        Ahora
      </span>
      <time
        className="font-mono text-2xl font-bold leading-tight tabular-nums tracking-tight text-sky-300 sub-glow-text"
        dateTime={now.toISOString()}
      >
        {time}
      </time>
      {!compact && (
        <>
          <span className="mt-0.5 text-center text-xs capitalize text-sky-100/45">
            {date}
          </span>
          <span className="text-[10px] text-rose-400/70">{tz}</span>
        </>
      )}
    </div>
  );
}
