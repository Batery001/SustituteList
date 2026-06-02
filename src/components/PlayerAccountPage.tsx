"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { formatDivision, type Division } from "@/lib/division";

export function PlayerAccountPage() {
  const router = useRouter();
  const [player, setPlayer] = useState<{
    playerName: string;
    popId: string;
    email: string;
    division: Division;
  } | null>(null);
  const [registrations, setRegistrations] = useState<
    {
      accessToken: string;
      paymentStatus: string;
      eventSlug?: string;
      eventName?: string;
      decklistSubmissionId?: string;
    }[]
  >([]);

  useEffect(() => {
    fetch("/api/auth/player/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.player) {
          router.push("/jugador/login");
          return;
        }
        setPlayer(data.player);
        setRegistrations(data.registrations ?? []);
      });
  }, [router]);

  async function logout() {
    await fetch("/api/auth/player/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (!player) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="sub-panel rounded-xl p-5">
        <h2 className="font-bold">{player.playerName}</h2>
        <p className="mt-1 text-sm text-sky-100/60">
          Pop {player.popId} · {formatDivision(player.division)}
        </p>
        <p className="text-xs text-sky-100/40">{player.email}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/jugador/perfil"
            className="text-sm text-sky-400 underline"
          >
            Editar perfil
          </Link>
          <Link
            href="/jugador/mazos"
            className="text-sm text-sky-400 underline"
          >
            Mis mazos
          </Link>
        </div>
        <Button
          type="button"
          variant="ghost"
          onClick={logout}
          className="mt-4 text-sm"
        >
          Cerrar sesión
        </Button>
      </section>

      <section>
        <h3 className="font-semibold text-sky-100/90">Mis inscripciones</h3>
        {registrations.length === 0 ? (
          <p className="mt-2 text-sm text-sky-100/45">
            Aún no te has inscrito a ningún torneo.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-sky-500/15 rounded-xl border border-sky-500/20">
            {registrations.map((r) => (
              <li key={r.accessToken} className="px-4 py-3">
                <p className="font-medium">{r.eventName ?? "Torneo"}</p>
                <p className="text-xs text-sky-100/50">
                  {r.paymentStatus === "paid" ? "Pagado" : "Pago pendiente"}
                  {r.decklistSubmissionId ? " · Lista enviada" : ""}
                </p>
                {r.eventSlug && (
                  <Link
                    href={`/e/${r.eventSlug}/mi-inscripcion/${r.accessToken}`}
                    className="sub-link mt-1 inline-block text-sm underline"
                  >
                    Ver inscripción →
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/" className="block text-center text-sm text-sky-100/45 underline">
        Inicio
      </Link>
    </div>
  );
}
