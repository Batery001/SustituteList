"use client";

import { usePathname } from "next/navigation";
import { PageShell } from "@/components/PageShell";

const SUBTITLES: Record<string, string> = {
  "/admin": "Panel · torneos e inscripciones",
  "/admin/perfil": "Perfil y pagos Webpay",
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const subtitle = SUBTITLES[pathname] ?? "Panel de la tienda";

  return (
    <PageShell subtitle={subtitle} area="store" maxWidth="2xl">
      {children}
    </PageShell>
  );
}
