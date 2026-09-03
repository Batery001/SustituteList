import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import {
  PasswordResetError,
  verifyPlayerRecovery,
  verifyStoreRecovery,
} from "@/lib/auth/password-reset";
import { isEmailConfigured, sendPasswordResetEmail } from "@/lib/email";

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

    if (isEmailConfigured()) {
      const resetUrl = `${getAppUrl()}/auth/recuperar?token=${encodeURIComponent(resetToken)}`;
      const mailed = await sendPasswordResetEmail({
        to: (body.email ?? "").toLowerCase().trim(),
        resetUrl,
      });
      if (mailed.ok) {
        return NextResponse.json({ ok: true, emailed: true });
      }
    }

    return NextResponse.json({ ok: true, emailed: false, resetToken });
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
