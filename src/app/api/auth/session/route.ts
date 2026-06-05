import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";

export async function GET() {
  const nextAuthSession = await auth();

  if (nextAuthSession?.user) {
    const { role, name, id, popId, birthDate, email } = nextAuthSession.user;
    return NextResponse.json({
      user: { id, email, name, role, popId, birthDate },
      store:
        role === "STORE" || role === "ADMIN" ? { name: name ?? "" } : null,
      player: role === "PLAYER" ? { playerName: name ?? "" } : null,
    });
  }

  const storeId = await getAdminStoreId();
  const playerId = await getPlayerId();

  if (!storeId && !playerId) {
    return NextResponse.json({ store: null, player: null, user: null });
  }

  await connectDB();

  let store: { name: string } | null = null;
  let player: { playerName: string } | null = null;

  if (storeId) {
    const doc = await Store.findById(storeId).lean();
    if (doc) store = { name: doc.name };
  }

  if (playerId) {
    const doc = await Player.findById(playerId).lean();
    if (doc) player = { playerName: doc.playerName };
  }

  return NextResponse.json({ store, player, user: null });
}
