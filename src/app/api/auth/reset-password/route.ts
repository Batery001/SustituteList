import { NextResponse } from "next/server";
import {
  PasswordResetError,
  applyPasswordReset,
} from "@/lib/auth/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      resetToken?: string;
      password?: string;
      passwordConfirm?: string;
    };

    if (!body.resetToken?.trim()) {
      return NextResponse.json(
        { error: "Sesión de recuperación inválida" },
        { status: 400 }
      );
    }

    if (!body.password || body.password !== body.passwordConfirm) {
      return NextResponse.json(
        { error: "Las contraseñas no coinciden" },
        { status: 400 }
      );
    }

    await applyPasswordReset(body.resetToken, body.password);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof PasswordResetError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "No se pudo actualizar la contraseña" },
      { status: 500 }
    );
  }
}
