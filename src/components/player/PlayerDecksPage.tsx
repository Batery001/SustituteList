"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { routes } from "@/lib/routes";

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
      if (!meRes.ok || !me.player) {
        router.push(
          `/auth/login?callbackUrl=${encodeURIComponent(routes.player.decks)}`
        );
        return;
      }
      setPlayerName(me.player.playerName);
      const decksData = await decksRes.json();
      setDecks(decksData.decks ?? []);
      setLoading(false);
    }).catch(() => {
      router.push(
        `/auth/login?callbackUrl=${encodeURIComponent(routes.player.decks)}`
      );
    });
  }, [router]);

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-sky-100/55">Mazos de {playerName}</p>
        <div className="flex gap-2">
          <Link
            href={routes.player.buildDeck}
            className="sub-btn-primary rounded-lg px-4 py-2 text-sm"
          >
            Armar mazo
          </Link>
          <Link
            href={routes.player.newDeck}
            className="rounded-lg border border-sky-500/30 px-4 py-2 text-sm text-sky-200 hover:bg-sky-950/50"
          >
            Pegar lista
          </Link>
        </div>
      </div>

      {decks.length === 0 ? (
        <section className="sub-panel rounded-xl p-6 text-center text-sm text-sky-100/55">
          <p>Aún no tienes mazos guardados.</p>
          <Link
            href={routes.player.newDeck}
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
                href={routes.player.deck(d._id)}
                className="sub-link text-sm underline"
              >
                Editar
              </Link>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
