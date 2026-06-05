import { cookies } from "next/headers";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/dbConnect";
import {
  COOKIE_NAME as ADMIN_COOKIE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth/session";
import { Player } from "@/models/Player";

export const PLAYER_COOKIE_NAME = "substitute_player_session";
export { createSessionToken, verifySessionToken };

export async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const legacy = verifySessionToken(token);
  if (legacy?.storeId) {
    return legacy.storeId;
  }

  const session = await auth();
  if (session?.user?.role !== "PLAYER" || !session.user.email) {
    return null;
  }

  await dbConnect();
  const player = await Player.findOne({
    email: session.user.email.toLowerCase(),
  })
    .select("_id")
    .lean();

  return player?._id.toString() ?? null;
}

export function createPlayerSessionToken(playerId: string): string {
  return createSessionToken(playerId);
}

export { ADMIN_COOKIE };
