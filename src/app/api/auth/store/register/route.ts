import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { COOKIE_NAME, MAX_AGE, createSessionToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getStoreTimezone, slugify } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      slug?: string;
      timezone?: string;
    };

    const { name, email, password, slug: customSlug, timezone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: msg.api.emailPasswordRequired },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }

    await connectDB();

    const normalizedEmail = email.toLowerCase().trim();
    if (await Store.findOne({ email: normalizedEmail })) {
      return NextResponse.json(
        { error: "Ya existe una tienda con este correo" },
        { status: 409 }
      );
    }

    let slug = customSlug ? slugify(customSlug) : slugify(name);
    if (!slug) slug = `tienda-${Date.now().toString(36)}`;
    if (await Store.findOne({ slug })) {
      return NextResponse.json({ error: msg.api.storeSlugTaken }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const store = await Store.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      slug,
      timezone: timezone?.trim() || getStoreTimezone(),
    });

    const token = createSessionToken(store._id.toString());
    const response = NextResponse.json({
      ok: true,
      store: { name: store.name, slug: store.slug },
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
    console.error("Store register error:", err);
    return NextResponse.json({ error: msg.api.storeRegisterFailed }, { status: 500 });
  }
}
