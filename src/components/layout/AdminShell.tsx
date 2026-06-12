"use client";

import { usePathname } from "next/navigation";
import { routes } from "@/lib/routes";
import { PageShell } from "./PageShell";

const SUBTITLES: Record<string, string> = {
  [routes.store.home]: "Panel · torneos",
  [routes.store.profile]: "Perfil y pagos Webpay",
  "/admin": "Panel · torneos e inscripciones",
  "/admin/perfil": "Perfil y pagos Webpay",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login" || pathname === "/jugador/login") {
    return <>{children}</>;
  }

  const subtitle = SUBTITLES[pathname] ?? "Panel de la tienda";

  return (
    <PageShell subtitle={subtitle} area="store" maxWidth="2xl">
      {children}
    </PageShell>
  );
}
