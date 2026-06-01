/** Zona horaria activa: Vercel (STORE_TIMEZONE) manda sobre la guardada en BD. */
export function getStoreTimezone(dbTimezone?: string | null): string {
  const fromEnv = process.env.STORE_TIMEZONE?.trim();
  if (fromEnv) return fromEnv;
  if (dbTimezone?.trim()) return dbTimezone.trim();
  return "America/Santiago";
}

/** Convierte "2026-06-01T12:00" (sin Z) a UTC interpretándolo como hora local en `timeZone`. */
export function parseDateTimeLocalInTimeZone(
  localDateTime: string,
  timeZone: string
): Date {
  const match = localDateTime.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/
  );
  if (!match) {
    return new Date(localDateTime);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  function wallTimeToUtcParts(utcMs: number) {
    const parts = formatter.formatToParts(new Date(utcMs));
    const map: Record<string, string> = {};
    for (const p of parts) {
      if (p.type !== "literal") map[p.type] = p.value;
    }
    const h = Number(map.hour);
    return {
      year: Number(map.year),
      month: Number(map.month),
      day: Number(map.day),
      hour: h === 24 ? 0 : h,
      minute: Number(map.minute),
    };
  }

  let utcMs = targetUtc;
  for (let i = 0; i < 5; i++) {
    const wall = wallTimeToUtcParts(utcMs);
    const wallAsUtc = Date.UTC(
      wall.year,
      wall.month - 1,
      wall.day,
      wall.hour,
      wall.minute
    );
    const diff = targetUtc - wallAsUtc;
    if (diff === 0) break;
    utcMs += diff;
  }

  return new Date(utcMs);
}

export function isDeadlinePassed(deadline: Date): boolean {
  return Date.now() > deadline.getTime();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function formatDeadline(deadline: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(deadline);
}

export function formatNowInTimeZone(timeZone: string): string {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date());
}

export function getTimezoneLabel(timeZone: string): string {
  if (timeZone === "America/Santiago") return "Chile";
  try {
    const parts = new Intl.DateTimeFormat("es-CL", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    const short =
      parts.find((p) => p.type === "timeZoneName")?.value ?? timeZone;
    return `${short}`;
  } catch {
    return timeZone;
  }
}

export function formatEventType(
  type: "cup" | "challenge" | "local"
): string {
  const labels = {
    cup: "League Cup",
    challenge: "League Challenge",
    local: "Torneo local",
  };
  return labels[type];
}
