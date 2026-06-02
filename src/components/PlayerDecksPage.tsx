"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface DeckRow {
  _id: string;
  name: string;
  cardCount: number;
  isValid: boolean;
  updatedAt: string;
}

export function PlayerDecksPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<DeckRow[]>([]);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/player/me"),
      fetch("/api/player/decks"),
    ]).then(async ([meRes, decksRes]) => {
      const me = await meRes.json();
      if (!me.player) {
        router.push("/jugador/login?next=/jugador/mazos");
        return;
      }
      setPlayerName(me.player.playerName);
      const decksData = await decksRes.json();
      setDecks(decksData.decks ?? []);
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-sky-100/55">Mazos de {playerName}</p>
        <Link
          href="/jugador/mazos/nuevo"
          className="sub-btn-primary rounded-lg px-4 py-2 text-sm"
        >
          + Nuevo mazo
        </Link>
      </div>

      {decks.length === 0 ? (
        <section className="sub-panel rounded-xl p-6 text-center text-sm text-sky-100/55">
          <p>Aún no tienes mazos guardados.</p>
          <Link
            href="/jugador/mazos/nuevo"
            className="sub-link mt-3 inline-block underline"
          >
            Crear tu primer mazo →
          </Link>
        </section>
      ) : (
        <ul className="divide-y divide-sky-500/15 rounded-xl border border-sky-500/20">
          {decks.map((d) => (
            <li key={d._id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-sky-100/50">
                  {d.cardCount}/60 cartas
                  {d.isValid ? (
                    <span className="text-emerald-400"> · Válido</span>
                  ) : (
                    <span className="text-amber-400"> · Revisar lista</span>
                  )}
                </p>
              </div>
              <Link
                href={`/jugador/mazos/${d._id}`}
                className="sub-link text-sm underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}

      <nav className="flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/jugador/cuenta" className="text-sky-100/45 underline">
          Mi cuenta
        </Link>
        <Link href="/jugador/perfil" className="text-sky-100/45 underline">
          Perfil
        </Link>
      </nav>
    </div>
  );
}
