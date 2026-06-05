import { NextResponse } from "next/server";
import { RegisterError, registerUser } from "@/lib/auth/register-user";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      role?: "PLAYER" | "STORE";
      name?: string;
      email?: string;
      password?: string;
      popId?: string;
      birthDate?: string;
      city?: string;
      country?: string;
    };

    const role = body.role;
    if (role !== "PLAYER" && role !== "STORE") {
      return NextResponse.json(
        { error: "Selecciona un tipo de cuenta válido" },
        { status: 400 }
      );
    }

    if (!body.name?.trim() || !body.email?.trim() || !body.password) {
      return NextResponse.json(
        { error: "Completa todos los campos obligatorios" },
        { status: 400 }
      );
    }

    if (role === "PLAYER") {
      if (!body.popId?.trim() || !body.birthDate) {
        return NextResponse.json(
          { error: "Pop ID y fecha de nacimiento son obligatorios" },
          { status: 400 }
        );
      }

      const result = await registerUser({
        role: "PLAYER",
        name: body.name,
        email: body.email,
        password: body.password,
        popId: body.popId,
        birthDate: body.birthDate,
      });

      return NextResponse.json({ ok: true, ...result }, { status: 201 });
    }

    if (!body.city?.trim()) {
      return NextResponse.json(
        { error: "La ciudad es obligatoria para tiendas" },
        { status: 400 }
      );
    }

    const result = await registerUser({
      role: "STORE",
      name: body.name,
      email: body.email,
      password: body.password,
      city: body.city,
      country: body.country ?? "Chile",
    });

    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (err) {
    if (err instanceof RegisterError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "No se pudo crear la cuenta" },
      { status: 500 }
    );
  }
}
