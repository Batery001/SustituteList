import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PlayerRegistrationsDashboard } from "@/components/player/PlayerRegistrationsDashboard";
import { connectDB } from "@/lib/db";
import { getPlayerRegistrations } from "@/lib/player/get-player-registrations";
import { getPlayerId } from "@/lib/player-auth";
import { Player } from "@/models/Player";
import { routes } from "@/lib/routes";

export default async function PlayerDashboardPage() {
  const session = await auth();
  const playerId = await getPlayerId();

  if (!session?.user && !playerId) {
    redirect(`${routes.auth.login}?callbackUrl=%2Fdashboard%2Fplayer`);
  }

  if (session?.user?.role === "STORE") {
    redirect(routes.store.home);
  }

  if (!playerId) {
    redirect(`${routes.auth.login}?callbackUrl=%2Fdashboard%2Fplayer`);
  }

  const { active, history } = await getPlayerRegistrations(playerId);

  let playerName = session?.user?.name ?? "Jugador";
  let popId = session?.user?.popId ?? null;

  if (!session?.user?.name || !session?.user?.popId) {
    await connectDB();
    const player = await Player.findById(playerId).lean();
    if (player) {
      playerName = player.playerName;
      popId = player.popId;
    }
  }

  return (
    <PlayerRegistrationsDashboard
      playerName={playerName}
      popId={popId}
      active={active}
      history={history}
    />
  );
}
