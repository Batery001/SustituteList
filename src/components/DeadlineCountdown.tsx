"use client";

import { useEffect, useMemo, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

function calcTimeLeft(deadlineMs: number): TimeLeft | null {
  const totalMs = deadlineMs - Date.now();
  if (totalMs <= 0) return null;

  const totalSec = Math.floor(totalMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  return { days, hours, minutes, seconds, totalMs };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex min-w-[2.75rem] flex-col items-center rounded-lg border border-sky-500/25 bg-[#060d18]/90 px-2 py-1.5">
      <span className="font-mono text-xl font-bold tabular-nums leading-none text-sky-300">
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[10px] font-medium uppercase text-sky-100/40">
        {label}
      </span>
    </div>
  );
}

interface DeadlineCountdownProps {
  deadlineIso: string;
  closed?: boolean;
}

export function DeadlineCountdown({
  deadlineIso,
  closed = false,
}: DeadlineCountdownProps) {
  const deadlineMs = useMemo(
    () => new Date(deadlineIso).getTime(),
    [deadlineIso]
  );
  const [left, setLeft] = useState<TimeLeft | null>(() =>
    calcTimeLeft(deadlineMs)
  );

  useEffect(() => {
    function tick() {
      setLeft(calcTimeLeft(deadlineMs));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);

  const expired = closed || left === null;
  const urgent = !expired && left && left.totalMs < 60 * 60 * 1000;

  if (expired) {
    return (
      <div
        className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/25 px-3 py-2.5"
        role="status"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-400/90">
          Tiempo para enviar
        </p>
        <p className="mt-1 text-sm font-semibold text-rose-300">Plazo terminado</p>
      </div>
    );
  }

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-2.5 ${
        urgent
          ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_16px_rgba(244,63,94,0.15)]"
          : "border-sky-500/30 bg-sky-950/20 shadow-[0_0_16px_rgba(56,189,248,0.1)]"
      }`}
      role="timer"
      aria-live="polite"
    >
      <p
        className={`text-xs font-semibold uppercase tracking-wide ${
          urgent ? "text-rose-400" : "text-sky-400"
        }`}
      >
        Tiempo para enviar tu lista
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {left.days > 0 && <CountdownUnit value={left.days} label="días" />}
        <CountdownUnit value={left.hours} label="hrs" />
        <CountdownUnit value={left.minutes} label="min" />
        <CountdownUnit value={left.seconds} label="seg" />
      </div>
      {urgent && (
        <p className="mt-2 text-xs text-rose-300/90">Queda menos de 1 hora</p>
      )}
    </div>
  );
}
