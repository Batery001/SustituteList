import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import {
  PLAYER_COOKIE_NAME,
  createPlayerSessionToken,
} from "@/lib/player-auth";
import { COOKIE_NAME, MAX_AGE } from "@/lib/auth";
import { Player } from "@/models/Player";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      playerName?: string;
      popId?: string;
      birthDate?: string;
    };

    const { email, password, playerName, popId, birthDate } = body;

    if (!email || !password || !playerName || !popId || !birthDate) {
      return NextResponse.json(
        { error: msg.api.allFieldsRequired },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    const birth = new Date(birthDate);
    if (Number.isNaN(birth.getTime())) {
      return NextResponse.json({ error: msg.api.invalidBirthDate }, { status: 400 });
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPopId = popId.trim();

    if (await Player.findOne({ email: normalizedEmail })) {
      return NextResponse.json({ error: msg.api.duplicateEmail }, { status: 409 });
    }

    if (await Player.findOne({ popId: normalizedPopId })) {
      return NextResponse.json(
        { error: msg.api.duplicatePopIdAccount },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const player = await Player.create({
      email: normalizedEmail,
      passwordHash,
      playerName: playerName.trim(),
      popId: normalizedPopId,
      birthDate: birth,
    });

    const token = createPlayerSessionToken(player._id.toString());
    const response = NextResponse.json({
      ok: true,
      player: {
        id: player._id.toString(),
        playerName: player.playerName,
        popId: player.popId,
        email: player.email,
        division: getDivision(birth),
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: MAX_AGE,
      path: "/",
    };
    response.cookies.set(PLAYER_COOKIE_NAME, token, cookieOptions);
    response.cookies.set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });

    return response;
  } catch (err) {
    console.error("Player register error:", err);
    return NextResponse.json({ error: msg.api.playerRegisterFailed }, { status: 500 });
  }
}
