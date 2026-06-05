import { NextResponse } from "next/server";
import { signOut } from "@/auth";
import { PLAYER_COOKIE_NAME } from "@/lib/player-auth";

export async function POST() {
  await signOut({ redirect: false });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PLAYER_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
