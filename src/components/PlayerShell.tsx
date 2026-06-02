"use client";

import { usePathname } from "next/navigation";
import { PageShell } from "@/components/PageShell";

const SUBTITLES: Record<string, string> = {
  "/jugador/login": "Iniciar sesión",
  "/jugador/registro": "Crear cuenta",
  "/jugador/cuenta": "Resumen e inscripciones",
  "/jugador/mazos": "Biblioteca de mazos",
  "/jugador/mazos/nuevo": "Nuevo mazo",
  "/jugador/perfil": "Datos de jugador",
};

export function PlayerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  let subtitle = SUBTITLES[pathname];

  if (!subtitle && pathname.startsWith("/jugador/mazos/")) {
    subtitle = "Editar mazo";
  }

  return (
    <PageShell subtitle={subtitle ?? "Área de jugador"} area="player">
      {children}
    </PageShell>
  );
}
