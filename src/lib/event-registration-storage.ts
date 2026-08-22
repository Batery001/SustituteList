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

export function clearEventRegistrationToken(eventSlug: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${PREFIX}${eventSlug}`);
  } catch {
    // localStorage no disponible
  }
}

export function decklistAuthHeaders(
  registrationAccessToken?: string | null
): HeadersInit {
  if (!registrationAccessToken) return {};
  return { "X-Registration-Token": registrationAccessToken };
}
