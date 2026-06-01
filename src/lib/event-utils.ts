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
  return new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(deadline);
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
