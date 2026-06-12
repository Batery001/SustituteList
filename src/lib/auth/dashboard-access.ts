import { auth } from "@/auth";
import { getAdminStoreId } from "@/lib/auth/session";
import { getPlayerId } from "@/lib/auth/player-session";
import type { UserRole } from "@/types/models";

export type DashboardAccess = {
  area: "store" | "player";
  role: UserRole;
  subtitle: string;
};

/** Acepta sesión NextAuth o cookies legacy de tienda/jugador. */
export async function getDashboardAccess(): Promise<DashboardAccess | null> {
  const session = await auth();
  const storeId = await getAdminStoreId();
  const playerId = await getPlayerId();

  if (session?.user) {
    const role = session.user.role;
    const area =
      role === "STORE" || role === "ADMIN" ? ("store" as const) : ("player" as const);
    return { area, role, subtitle: `Panel · ${role}` };
  }

  if (storeId) {
    return { area: "store", role: "STORE", subtitle: "Panel · STORE" };
  }

  if (playerId) {
    return { area: "player", role: "PLAYER", subtitle: "Panel · PLAYER" };
  }

  return null;
}
