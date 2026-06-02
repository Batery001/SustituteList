import { NextResponse } from "next/server";
import { loginErrorResponse } from "@/lib/api-errors";
import { msg } from "@/lib/messages";
import { signInWithEmailPassword } from "@/lib/sign-in";

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

    return signInWithEmailPassword(email, password);
  } catch (err) {
    const { status, body } = loginErrorResponse(err);
    return NextResponse.json(body, { status });
  }
}
