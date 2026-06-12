"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";

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
          <NavLink
            href={routes.store.home}
            active={pathname.startsWith("/dashboard/store")}
          >
            Panel
          </NavLink>
          <NavLink
            href={routes.store.profile}
            active={pathname === routes.store.profile}
          >
            Perfil tienda
          </NavLink>
          <NavLink href="/" active={pathname === "/"}>
            Inicio jugadores
          </NavLink>
          {hasPlayer && (
            <NavLink
              href={routes.player.home}
              active={pathname.startsWith("/dashboard/player")}
            >
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
              <NavLink href={routes.auth.login} active={pathname === routes.auth.login}>
                Iniciar sesión
              </NavLink>
              <NavLink href={routes.auth.register} active={pathname === routes.auth.register}>
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
            <Link href={routes.store.home} className="underline">
              Ir al panel
            </Link>
          </p>
        )}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sky-400">
          Modo jugador · {session!.player!.playerName}
        </p>
        <div className="flex flex-wrap gap-1">
          <NavLink href="/tiendas" active={pathname === "/tiendas" || pathname.startsWith("/t/")}>
            Tiendas
          </NavLink>
          <NavLink href="/" active={pathname === "/"}>
            Inicio
          </NavLink>
          <NavLink
            href={routes.player.home}
            active={pathname === routes.player.home}
          >
            Inscripciones
          </NavLink>
          <NavLink
            href={routes.player.decks}
            active={
              pathname === routes.player.decks ||
              pathname.startsWith("/dashboard/player/decks/")
            }
          >
            Mis mazos
          </NavLink>
          <NavLink
            href={routes.player.profile}
            active={pathname === routes.player.profile}
          >
            Perfil
          </NavLink>
          {hasStore && (
            <NavLink
              href={routes.store.home}
              active={pathname.startsWith("/dashboard/store")}
            >
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
            <NavLink
              href={routes.store.home}
              active={pathname.startsWith("/dashboard/store")}
            >
              Panel tienda
            </NavLink>
            <NavLink
              href={routes.store.profile}
              active={pathname === routes.store.profile}
            >
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
          <NavLink href={routes.auth.login} active={pathname === routes.auth.login}>
            Iniciar sesión
          </NavLink>
          <NavLink href={routes.auth.register} active={pathname === routes.auth.register}>
            Crear cuenta
          </NavLink>
        </div>
      </nav>
    );
  }

  return null;
}
