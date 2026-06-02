import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { MAX_AGE } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import {
  PLAYER_COOKIE_NAME,
  createPlayerSessionToken,
} from "@/lib/player-auth";
import { Player } from "@/models/Player";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: msg.api.playerEmailPasswordRequired },
        { status: 400 }
      );
    }

    await connectDB();

    const player = await Player.findOne({ email: email.toLowerCase().trim() });
    if (!player) {
      return NextResponse.json({ error: msg.api.playerLoginFailed }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, player.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: msg.api.playerLoginFailed }, { status: 401 });
    }

    const token = createPlayerSessionToken(player._id.toString());
    const response = NextResponse.json({
      ok: true,
      player: {
        id: player._id.toString(),
        playerName: player.playerName,
        popId: player.popId,
        email: player.email,
        birthDate: player.birthDate,
        division: getDivision(player.birthDate),
      },
    });

    response.cookies.set(PLAYER_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("Player login error:", err);
    return NextResponse.json({ error: msg.api.playerLoginFailed }, { status: 500 });
  }
}
