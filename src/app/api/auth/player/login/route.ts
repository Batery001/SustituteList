import { NextResponse } from "next/server";
import { msg } from "@/lib/messages";
import { signInWithEmailPassword } from "@/lib/sign-in";

export const runtime = "nodejs";

/** Alias del login unificado (compatibilidad). */
export async function POST(request: Request) {
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

  return signInWithEmailPassword(email, password);
}
