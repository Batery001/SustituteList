const PREFIX = "substitute-event-reg:";

export function saveEventRegistrationToken(
  eventSlug: string,
  accessToken: string
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PREFIX}${eventSlug}`, accessToken);
  } catch {
    // localStorage no disponible
  }
}

export function getEventRegistrationToken(eventSlug: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${PREFIX}${eventSlug}`);
  } catch {
    return null;
  }
}
