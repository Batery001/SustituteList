import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  sendVerificationEmailTo,
  verifyEmailVerifyToken,
  markEmailVerified,
  isEmailVerified,
} from "@/lib/auth/email-verification";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getPlayerId } from "@/lib/player-auth";
import { msg } from "@/lib/messages";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

async function sessionEmail(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.email) return session.user.email.toLowerCase();

  await connectDB();
  const [storeId, playerId] = await Promise.all([
    getAdminStoreId(),
    getPlayerId(),
  ]);
  if (playerId) {
    const player = await Player.findById(playerId).select("email").lean();
    if (player?.email) return player.email;
  }
  if (storeId) {
    const store = await Store.findById(storeId).select("email").lean();
    if (store?.email) return store.email;
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const email = await sessionEmail();
    if (!email) {
      return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
    }

    let force = true;
    try {
      const body = (await request.json()) as { auto?: boolean };
      if (body.auto) force = false;
    } catch {
      // sin cuerpo: reenvío manual
    }

    const result = await sendVerificationEmailTo(email, { force });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Verify email send error:", err);
    return NextResponse.json(
      { error: "No se pudo enviar el correo de verificación" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    const parsed = verifyEmailVerifyToken(body.token);
    if (!parsed) {
      return NextResponse.json(
        { error: "El enlace no es válido o ya venció" },
        { status: 400 }
      );
    }
    const ok = await markEmailVerified(parsed.email);
    if (!ok) {
      return NextResponse.json({ error: msg.api.playerNotFound }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      verified: await isEmailVerified(parsed.email),
    });
  } catch (err) {
    console.error("Verify email confirm error:", err);
    return NextResponse.json(
      { error: "No se pudo verificar el correo" },
      { status: 500 }
    );
  }
}
