import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { COOKIE_NAME } from "@/lib/auth";
import { PLAYER_COOKIE_NAME } from "@/lib/player-auth";

const clearOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 0,
  path: "/",
};

/** Cierra sesión de tienda (legacy + NextAuth). */
export async function POST() {
  await signOut({ redirect: false });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_NAME, "", clearOpts);
  response.cookies.set(PLAYER_COOKIE_NAME, "", clearOpts);
  return response;
}
