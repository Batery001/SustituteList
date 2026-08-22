import { headers } from "next/headers";
import { getAdminStoreId } from "@/lib/auth/session";
import { getPlayerId } from "@/lib/auth/player-session";
import { Registration } from "@/models/Registration";
import type { Types } from "mongoose";

type DecklistDoc = {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  popId: string;
  registrationId?: Types.ObjectId | null;
};

type EventDoc = {
  storeId: Types.ObjectId;
};

async function findRegistrationForSubmission(submission: DecklistDoc) {
  if (submission.registrationId) {
    const byId = await Registration.findById(submission.registrationId);
    if (byId) return byId;
  }

  return Registration.findOne({
    eventId: submission.eventId,
    $or: [
      { decklistSubmissionId: submission._id },
      { popId: submission.popId },
    ],
  });
}

/** Tienda del torneo o el jugador/invitado que envió la lista. */
export async function getDecklistAccess(
  submission: DecklistDoc,
  event: EventDoc
): Promise<"store" | "owner" | null> {
  const storeId = await getAdminStoreId();
  if (storeId && event.storeId.toString() === storeId) {
    return "store";
  }

  const registration = await findRegistrationForSubmission(submission);
  if (!registration) return null;

  const playerId = await getPlayerId();
  if (playerId && registration.playerId?.toString() === playerId) {
    return "owner";
  }

  const headerList = await headers();
  const accessToken = headerList.get("x-registration-token")?.trim();
  if (accessToken && accessToken === registration.accessToken) {
    return "owner";
  }

  return null;
}
