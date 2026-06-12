"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { PageShell } from "./PageShell";

const SUBTITLES: Record<string, string> = {
  [routes.player.home]: "Inscripciones y torneos",
  [routes.player.decks]: "Biblioteca de mazos",
  [routes.player.newDeck]: "Nuevo mazo",
  [routes.player.buildDeck]: "Armar mazo",
  [routes.player.profile]: "Datos de jugador",
  "/jugador/login": "Iniciar sesión",
  "/jugador/registro": "Crear cuenta",
};

export function PlayerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  let subtitle = SUBTITLES[pathname];

  if (
    !subtitle &&
    (pathname.startsWith("/dashboard/player/decks/") ||
      pathname.startsWith("/jugador/mazos/"))
  ) {
    subtitle = "Editar mazo";
  }

  return (
    <PageShell subtitle={subtitle ?? "Área de jugador"} area="player">
      {children}
    </PageShell>
  );
}
