import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  MAX_AGE,
  createSessionToken,
} from "@/lib/auth/session";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import {
  PLAYER_COOKIE_NAME,
  createPlayerSessionToken,
} from "@/lib/auth/player-session";
import { ensureStore } from "@/lib/store-seed";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: MAX_AGE,
  path: "/",
};

function clearCookie(name: string) {
  return { name, value: "", ...cookieOptions, maxAge: 0 };
}

export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<NextResponse> {
  const normalizedEmail = email.toLowerCase().trim();

  await connectDB();
  await ensureStore();

  const store = await Store.findOne({ email: normalizedEmail });
  if (store) {
    const valid = await bcrypt.compare(password, store.passwordHash);
    if (valid) {
      const token = createSessionToken(store._id.toString());
      const response = NextResponse.json({
        ok: true,
        role: "store" as const,
        redirect: "/dashboard/store",
        store: { name: store.name },
      });
      response.cookies.set(COOKIE_NAME, token, cookieOptions);
      response.cookies.set(clearCookie(PLAYER_COOKIE_NAME));
      return response;
    }
  }

  const player = await Player.findOne({ email: normalizedEmail });
  if (player) {
    const valid = await bcrypt.compare(password, player.passwordHash);
    if (valid) {
      const token = createPlayerSessionToken(player._id.toString());
      const response = NextResponse.json({
        ok: true,
        role: "player" as const,
        redirect: "/dashboard/player",
        player: {
          playerName: player.playerName,
          division: getDivision(player.birthDate),
        },
      });
      response.cookies.set(PLAYER_COOKIE_NAME, token, cookieOptions);
      response.cookies.set(clearCookie(COOKIE_NAME));
      return response;
    }
  }

  return NextResponse.json(
    { error: msg.api.loginFailed },
    { status: 401 }
  );
}
