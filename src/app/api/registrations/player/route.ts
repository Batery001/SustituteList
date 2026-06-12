import { NextResponse } from "next/server";
import { getPlayerRegistrations } from "@/lib/player/get-player-registrations";
import { getPlayerId } from "@/lib/player-auth";
import { msg } from "@/lib/messages";

export const runtime = "nodejs";

export async function GET() {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const { active, history } = await getPlayerRegistrations(playerId);
    return NextResponse.json({ active, history });
  } catch (err) {
    console.error("Player registrations error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar tus inscripciones" },
      { status: 500 }
    );
  }
}
