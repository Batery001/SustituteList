import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { loginErrorResponse } from "@/lib/api-errors";
import {
  COOKIE_NAME,
  MAX_AGE,
  createSessionToken,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { ensureStore } from "@/lib/store-seed";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: msg.api.emailPasswordRequired },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();

    await connectDB();
    await ensureStore();

    const store = await Store.findOne({ email: normalizedEmail });

    if (!store) {
      return NextResponse.json(
        {
          error: msg.api.loginFailed,
          hint:
            adminEmail && normalizedEmail !== adminEmail
              ? `Usa el mismo correo que ADMIN_EMAIL en Vercel (${adminEmail}).`
              : undefined,
        },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, store.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          error: msg.api.loginFailed,
          hint: "La contraseña no coincide. Debe ser la misma que ADMIN_PASSWORD en Vercel.",
        },
        { status: 401 }
      );
    }

    const token = createSessionToken(store._id.toString());
    const response = NextResponse.json({
      ok: true,
      store: { name: store.name, timezone: store.timezone },
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: MAX_AGE,
      path: "/",
    });

    return response;
  } catch (err) {
    const { status, body } = loginErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
