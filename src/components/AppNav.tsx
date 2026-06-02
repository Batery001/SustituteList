"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Area = "public" | "player" | "store";

interface Session {
  store: { name: string } | null;
  player: { playerName: string } | null;
}

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-sky-500/25 text-sky-100"
          : "text-sky-100/55 hover:bg-sky-950/60 hover:text-sky-100"
      }`}
    >
      {children}
    </Link>
  );
}

export function AppNav({ area }: { area: Area }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ store: null, player: null }));
  }, [pathname]);

  async function logoutStore() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function logoutPlayer() {
    await fetch("/api/auth/player/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const hasStore = Boolean(session?.store);
  const hasPlayer = Boolean(session?.player);
  const dualSession = hasStore && hasPlayer;

  if (area === "store" && hasStore) {
    return (
      <nav className="border-t border-sky-500/15 px-4 py-3">
        {dualSession && (
          <p className="mb-2 text-xs text-amber-300/90">
            Tienes sesión de tienda y de jugador abiertas. Cierra una si te
            confundes.
          </p>
        )}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-400/90">
          Modo tienda · {session!.store!.name}
        </p>
        <div className="flex flex-wrap gap-1">
          <NavLink href="/admin" active={pathname === "/admin"}>
            Panel
          </NavLink>
          <NavLink href="/admin/perfil" active={pathname === "/admin/perfil"}>
            Perfil tienda
          </NavLink>
          <NavLink href="/" active={pathname === "/"}>
            Inicio jugadores
          </NavLink>
          {hasPlayer && (
            <NavLink href="/jugador/cuenta" active={pathname.startsWith("/jugador")}>
              Mi cuenta jugador
            </NavLink>
          )}
          <button
            type="button"
            onClick={logoutStore}
            className="rounded-lg px-3 py-1.5 text-xs text-sky-100/45 hover:text-red-300"
          >
            Salir tienda
          </button>
        </div>
      </nav>
    );
  }

  if (area === "player" || (area === "public" && hasPlayer)) {
    if (!hasPlayer) {
      if (area === "player") {
        return (
          <nav className="border-t border-sky-500/15 px-4 py-3">
            <p className="mb-2 text-xs text-sky-100/50">No has iniciado sesión</p>
            <div className="flex flex-wrap gap-1">
              <NavLink href="/login" active={pathname === "/login"}>
                Iniciar sesión
              </NavLink>
              <NavLink href="/jugador/registro" active={pathname === "/jugador/registro"}>
                Crear cuenta
              </NavLink>
              <NavLink href="/" active={pathname === "/"}>
                Inicio
              </NavLink>
            </div>
          </nav>
        );
      }
      return null;
    }

    return (
      <nav className="border-t border-sky-500/15 px-4 py-3">
        {dualSession && area === "player" && (
          <p className="mb-2 text-xs text-amber-300/90">
            También estás conectado como tienda.{" "}
            <Link href="/admin" className="underline">
              Ir al panel
            </Link>
          </p>
        )}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-400">
          Modo jugador · {session!.player!.playerName}
        </p>
        <div className="flex flex-wrap gap-1">
          <NavLink href="/" active={pathname === "/"}>
            Inicio
          </NavLink>
          <NavLink href="/jugador/cuenta" active={pathname === "/jugador/cuenta"}>
            Mi cuenta
          </NavLink>
          <NavLink
            href="/jugador/mazos"
            active={
              pathname === "/jugador/mazos" || pathname.startsWith("/jugador/mazos/")
            }
          >
            Mis mazos
          </NavLink>
          <NavLink href="/jugador/perfil" active={pathname === "/jugador/perfil"}>
            Perfil
          </NavLink>
          {hasStore && (
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>
              Panel tienda
            </NavLink>
          )}
          <button
            type="button"
            onClick={logoutPlayer}
            className="rounded-lg px-3 py-1.5 text-xs text-sky-100/45 hover:text-red-300"
          >
            Salir
          </button>
        </div>
      </nav>
    );
  }

  if (area === "public") {
    if (hasStore) {
      return (
        <nav className="border-t border-sky-500/15 px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase text-rose-400/90">
            Modo tienda · {session!.store!.name}
          </p>
          <div className="flex flex-wrap gap-1">
            <NavLink href="/admin" active={pathname.startsWith("/admin")}>
              Panel tienda
            </NavLink>
            <NavLink href="/admin/perfil" active={pathname === "/admin/perfil"}>
              Perfil tienda
            </NavLink>
            <button
              type="button"
              onClick={logoutStore}
              className="rounded-lg px-3 py-1.5 text-xs text-sky-100/45 hover:text-red-300"
            >
              Salir tienda
            </button>
          </div>
        </nav>
      );
    }

    return (
      <nav className="border-t border-sky-500/15 px-4 py-3">
        <div className="flex flex-wrap gap-1">
          <NavLink href="/login" active={pathname === "/login"}>
            Iniciar sesión
          </NavLink>
          <NavLink href="/jugador/registro" active={pathname === "/jugador/registro"}>
            Crear cuenta
          </NavLink>
        </div>
      </nav>
    );
  }

  return null;
}
