import { NextResponse } from "next/server";
import {
  PasswordResetError,
  verifyPlayerRecovery,
  verifyStoreRecovery,
} from "@/lib/auth/password-reset";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      accountType?: "PLAYER" | "STORE";
      email?: string;
      popId?: string;
      birthDate?: string;
      storeName?: string;
    };

    if (body.accountType !== "PLAYER" && body.accountType !== "STORE") {
      return NextResponse.json(
        { error: "Selecciona jugador o tienda" },
        { status: 400 }
      );
    }

    const resetToken =
      body.accountType === "PLAYER"
        ? await verifyPlayerRecovery({
            email: body.email ?? "",
            popId: body.popId ?? "",
            birthDate: body.birthDate ?? "",
          })
        : await verifyStoreRecovery({
            email: body.email ?? "",
            storeName: body.storeName ?? "",
          });

    return NextResponse.json({ ok: true, resetToken });
  } catch (err) {
    if (err instanceof PasswordResetError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "No se pudo verificar la cuenta" },
      { status: 500 }
    );
  }
}
