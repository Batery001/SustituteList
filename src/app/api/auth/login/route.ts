import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import {
  COOKIE_NAME,
  MAX_AGE,
  createSessionToken,
} from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ensureStore } from "@/lib/store-seed";
import { msg } from "@/lib/messages";
import { Store } from "@/models/Store";

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

    await connectDB();
    await ensureStore();

    const store = await Store.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!store) {
      return NextResponse.json({ error: msg.api.loginFailed }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, store.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: msg.api.loginFailed }, { status: 401 });
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
    console.error("Login error:", err);
    return NextResponse.json(
      { error: msg.api.serverConfigError },
      { status: 500 }
    );
  }
}
