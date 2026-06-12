import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PlayerRegistrationsDashboard } from "@/components/player/PlayerRegistrationsDashboard";
import { getPlayerRegistrations } from "@/lib/player/get-player-registrations";
import { getPlayerId } from "@/lib/player-auth";

export default async function PlayerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/login?callbackUrl=%2Fdashboard%2Fplayer");

  if (session.user.role === "STORE") {
    redirect("/dashboard/store");
  }

  const playerId = await getPlayerId();
  if (!playerId) {
    redirect("/auth/login?callbackUrl=%2Fdashboard%2Fplayer");
  }

  const { active, history } = await getPlayerRegistrations(playerId);

  return (
    <PlayerRegistrationsDashboard
      playerName={session.user.name ?? "Jugador"}
      popId={session.user.popId}
      active={active}
      history={history}
    />
  );
}
