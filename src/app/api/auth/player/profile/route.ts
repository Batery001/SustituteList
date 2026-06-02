import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";

export async function PUT(request: Request) {
  const playerId = await getPlayerId();
  if (!playerId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const { playerName } = (await request.json()) as { playerName?: string };

    if (!playerName?.trim()) {
      return NextResponse.json(
        { error: "El nombre es obligatorio" },
        { status: 400 }
      );
    }

    await connectDB();
    const player = await Player.findById(playerId);
    if (!player) {
      return NextResponse.json({ error: msg.api.playerNotFound }, { status: 404 });
    }

    player.playerName = playerName.trim();
    await player.save();

    return NextResponse.json({
      player: {
        id: player._id.toString(),
        playerName: player.playerName,
        popId: player.popId,
        email: player.email,
        division: getDivision(player.birthDate),
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: msg.api.profileUpdateFailed }, { status: 500 });
  }
}
