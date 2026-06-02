import { cookies } from "next/headers";
import {
  COOKIE_NAME as ADMIN_COOKIE,
  createSessionToken,
  verifySessionToken,
} from "@/lib/auth";

export const PLAYER_COOKIE_NAME = "substitute_player_session";
export { createSessionToken, verifySessionToken };

export async function getPlayerId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PLAYER_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);
  return session?.storeId ?? null; // payload uses storeId field name; here it's playerId
}

export function createPlayerSessionToken(playerId: string): string {
  return createSessionToken(playerId);
}

export { ADMIN_COOKIE };
