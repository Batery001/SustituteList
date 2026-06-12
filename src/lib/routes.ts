/** Rutas canónicas del panel (usar en lugar de /admin y /jugador). */
export const routes = {
  store: {
    home: "/dashboard/store",
    profile: "/dashboard/store/profile",
    newEvent: "/dashboard/store/new-event",
    event: (id: string) => `/dashboard/store/events/${id}`,
  },
  player: {
    home: "/dashboard/player",
    decks: "/dashboard/player/decks",
    newDeck: "/dashboard/player/decks/new",
    deck: (id: string) => `/dashboard/player/decks/${id}`,
    profile: "/dashboard/player/profile",
    uploadDeck: (registrationId: string) =>
      `/dashboard/player/upload/${registrationId}`,
  },
  auth: {
    login: "/auth/login",
    register: "/auth/register",
  },
} as const;

/** Redirecciones permanentes desde rutas legacy. */
export const legacyRedirects: { source: string; destination: string }[] = [
  { source: "/admin", destination: routes.store.home },
  { source: "/admin/perfil", destination: routes.store.profile },
  { source: "/admin/login", destination: `${routes.auth.login}?callbackUrl=%2Fdashboard%2Fstore` },
  { source: "/jugador/cuenta", destination: routes.player.home },
  { source: "/jugador/mazos", destination: routes.player.decks },
  { source: "/jugador/mazos/nuevo", destination: routes.player.newDeck },
  { source: "/jugador/perfil", destination: routes.player.profile },
  { source: "/jugador/login", destination: `${routes.auth.login}?callbackUrl=%2Fdashboard%2Fplayer` },
  { source: "/jugador/registro", destination: routes.auth.register },
];
