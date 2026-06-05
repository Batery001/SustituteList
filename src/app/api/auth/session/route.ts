import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";

export async function GET() {
  const nextAuthSession = await auth();
  const storeId = await getAdminStoreId();
  const playerId = await getPlayerId();

  if (!storeId && !playerId && !nextAuthSession?.user) {
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

  const user = nextAuthSession?.user
    ? {
        id: nextAuthSession.user.id,
        email: nextAuthSession.user.email,
        name: nextAuthSession.user.name,
        role: nextAuthSession.user.role,
        popId: nextAuthSession.user.popId,
        birthDate: nextAuthSession.user.birthDate,
      }
    : null;

  if (!store && user && (user.role === "STORE" || user.role === "ADMIN")) {
    store = { name: user.name ?? "Tienda" };
  }

  if (!player && user?.role === "PLAYER") {
    player = { playerName: user.name ?? "Jugador" };
  }

  return NextResponse.json({ store, player, user });
}
