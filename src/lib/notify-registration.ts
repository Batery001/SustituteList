import { getAppUrl } from "@/lib/app-url";
import { sendRegistrationEmail } from "@/lib/email";
import { Player } from "@/models/Player";

export async function notifyNewRegistration(input: {
  email?: string | null;
  playerId?: { toString(): string } | null;
  playerName: string;
  eventName: string;
  storeName: string;
  accessToken: string;
  eventSlug: string;
  hasAccount: boolean;
}) {
  let to = input.email?.trim().toLowerCase() ?? "";
  if (!to && input.playerId) {
    const player = await Player.findById(input.playerId).select("email").lean();
    to = player?.email ?? "";
  }
  if (!to) return;

  const app = getAppUrl();
  await sendRegistrationEmail({
    to,
    playerName: input.playerName,
    eventName: input.eventName,
    storeName: input.storeName,
    manageUrl: `${app}/e/${input.eventSlug}/mi-inscripcion/${input.accessToken}`,
    hasAccount: input.hasAccount,
    loginUrl: `${app}/auth/login?callbackUrl=${encodeURIComponent(`/e/${input.eventSlug}`)}`,
  });
}
