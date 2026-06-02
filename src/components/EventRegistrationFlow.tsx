"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EventSubmitForm } from "@/components/EventSubmitForm";
import { Button } from "@/components/ui/Button";
import { formatDivision } from "@/lib/division";

interface EventRegistrationFlowProps {
  eventSlug: string;
  canSubmit: boolean;
  deadlineLabel: string;
  entryFeeCents: number;
  storeName: string;
  storeAddress?: string;
  storeCity?: string;
  storePhone?: string;
}

type Step = "register" | "pay" | "decklist" | "done" | "closed";

function formatFee(pesos: number): string {
  if (pesos <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

export function EventRegistrationFlow({
  eventSlug,
  canSubmit,
  deadlineLabel,
  entryFeeCents,
  storeName,
  storeAddress,
  storeCity,
  storePhone,
}: EventRegistrationFlowProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<{
    playerName: string;
    popId: string;
    division: string;
  } | null>(null);
  const [registration, setRegistration] = useState<{
    accessToken: string;
    paymentStatus: string;
    deckEditToken: string | null;
  } | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPopId, setGuestPopId] = useState("");
  const [guestBirth, setGuestBirth] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingToken, setExistingToken] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [meRes, evRes] = await Promise.all([
      fetch("/api/auth/player/me"),
      fetch(`/api/events/${eventSlug}`),
    ]);
    const meData = await meRes.json();
    const evData = await evRes.json();

    if (meData.player) {
      setPlayer({
        playerName: meData.player.playerName,
        popId: meData.player.popId,
        division: meData.player.division,
      });
    }
    setRegistration(evData.myRegistration ?? null);
    setLoading(false);
  }, [eventSlug]);

  useEffect(() => {
    load();
  }, [load]);

  function currentStep(): Step {
    if (!canSubmit && !registration?.deckEditToken) return "closed";
    if (!registration) return "register";
    if (registration.paymentStatus !== "paid") return "pay";
    if (registration.deckEditToken) return "done";
    return "decklist";
  }

  const step = currentStep();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setExistingToken(null);
    setRegistering(true);

    const body = player
      ? { eventSlug }
      : { eventSlug, playerName: guestName, popId: guestPopId, birthDate: guestBirth };

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 409 && data.accessToken) {
        setExistingToken(data.accessToken);
        setError(data.error);
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "No se pudo inscribir");
        return;
      }

      router.push(`/e/${eventSlug}/mi-inscripcion/${data.registration.accessToken}`);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  const steps = [
    { id: "register", label: "1. Inscripción" },
    { id: "pay", label: "2. Pago" },
    { id: "decklist", label: "3. Lista" },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 text-xs">
        {steps.map((s) => {
          const active =
            s.id === step ||
            (s.id === "register" && step !== "closed") ||
            (s.id === "pay" &&
              (step === "pay" || step === "decklist" || step === "done")) ||
            (s.id === "decklist" && (step === "decklist" || step === "done"));
          const done =
            (s.id === "register" && registration) ||
            (s.id === "pay" && registration?.paymentStatus === "paid") ||
            (s.id === "decklist" && registration?.deckEditToken);
          return (
            <span
              key={s.id}
              className={`flex-1 rounded-lg border px-2 py-2 text-center ${
                done
                  ? "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                  : active
                    ? "border-sky-500/50 bg-sky-950/40 text-sky-200"
                    : "border-sky-500/15 text-sky-100/35"
              }`}
            >
              {s.label}
            </span>
          );
        })}
      </nav>

      {step === "register" && (
        <section className="sub-panel rounded-xl p-5">
          <h2 className="font-bold text-sky-50">Inscribirse al torneo</h2>
          <p className="mt-1 text-sm text-sky-100/55">
            Cuota: {formatFee(entryFeeCents)} · {storeName}
          </p>

          {player ? (
            <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-950/30 p-4 text-sm">
              <p className="font-medium">{player.playerName}</p>
              <p className="text-sky-100/60">
                Pop {player.popId} · {formatDivision(player.division as "master")}
              </p>
              <Link href="/jugador/cuenta" className="sub-link mt-2 inline-block text-xs underline">
                Mi cuenta
              </Link>
            </div>
          ) : guestMode ? (
            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Nombre completo"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="sub-input w-full px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Pop ID"
                required
                value={guestPopId}
                onChange={(e) => setGuestPopId(e.target.value)}
                className="sub-input w-full px-3 py-2 text-sm"
              />
              <input
                type="date"
                required
                value={guestBirth}
                onChange={(e) => setGuestBirth(e.target.value)}
                className="sub-input w-full px-3 py-2 text-sm"
              />
            </div>
          ) : (
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-sky-100/70">
                Inicia sesión o crea una cuenta para inscribirte más rápido.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/jugador/login?next=/e/${eventSlug}`}
                  className="sub-btn-primary rounded-lg px-4 py-2 text-sm"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={`/jugador/registro?next=/e/${eventSlug}`}
                  className="rounded-lg border border-sky-500/30 px-4 py-2 text-sm text-sky-200"
                >
                  Crear cuenta
                </Link>
                <button
                  type="button"
                  onClick={() => setGuestMode(true)}
                  className="text-xs text-sky-100/45 underline"
                >
                  Inscribirme sin cuenta
                </button>
              </div>
            </div>
          )}

          {(player || guestMode) && (
            <form onSubmit={handleRegister} className="mt-4">
              {error && (
                <div className="mb-3 rounded-lg border border-red-800 bg-red-950/50 p-3 text-sm text-red-200">
                  {error}
                  {existingToken && (
                    <p className="mt-2">
                      <Link
                        href={`/e/${eventSlug}/mi-inscripcion/${existingToken}`}
                        className="font-semibold underline"
                      >
                        Ir a mi inscripción →
                      </Link>
                    </p>
                  )}
                </div>
              )}
              <Button type="submit" disabled={registering} className="w-full">
                {registering ? "Inscribiendo…" : "Confirmar inscripción"}
              </Button>
            </form>
          )}
        </section>
      )}

      {step === "pay" && registration && (
        <section className="sub-panel-accent rounded-xl p-5">
          <h2 className="font-bold text-sky-50">Pago pendiente</h2>
          <p className="mt-2 text-sm text-sky-100/70">
            Tu inscripción está registrada. Paga{" "}
            <strong>{formatFee(entryFeeCents)}</strong> en{" "}
            <strong>{storeName}</strong> para poder enviar tu lista.
          </p>
          {(storeAddress || storeCity) && (
            <p className="mt-2 text-sm text-sky-100/50">
              {[storeAddress, storeCity].filter(Boolean).join(", ")}
              {storePhone ? ` · ${storePhone}` : ""}
            </p>
          )}
          <p className="mt-4 text-xs text-sky-100/40">
            El staff marcará tu pago en el panel. Esta página se actualiza sola.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href={`/e/${eventSlug}/mi-inscripcion/${registration.accessToken}`}
              className="sub-btn-primary rounded-xl py-3 text-center text-sm"
            >
              Ver estado de mi inscripción
            </Link>
            <button
              type="button"
              onClick={load}
              className="text-xs text-sky-400 underline"
            >
              Actualizar estado
            </button>
          </div>
        </section>
      )}

      {step === "decklist" && registration && (
        <section>
          <div className="sub-panel mb-4 rounded-xl p-4 text-sm text-emerald-300">
            Pago confirmado. Ya puedes registrar tu lista de 60 cartas.
          </div>
          <EventSubmitForm
            eventSlug={eventSlug}
            canSubmit={canSubmit}
            deadlineLabel={deadlineLabel}
            registrationAccessToken={registration.accessToken}
            playerPreview={player ?? undefined}
          />
        </section>
      )}

      {step === "done" && registration?.deckEditToken && (
        <section className="sub-panel rounded-xl p-6 text-center">
          <p className="font-semibold text-emerald-300">Lista enviada</p>
          <p className="mt-2 text-sm text-sky-100/60">
            Puedes ver o editar tu lista hasta {deadlineLabel}.
          </p>
          <Link
            href={`/e/${eventSlug}/deck/${registration.deckEditToken}`}
            className="sub-btn-primary mt-4 inline-block rounded-xl px-6 py-3 text-sm"
          >
            Abrir mi lista
          </Link>
        </section>
      )}

      {step === "closed" && (
        <div className="sub-panel rounded-xl p-6 text-center">
          <p className="font-semibold text-sky-100">Torneo cerrado o plazo vencido</p>
          {registration?.deckEditToken && (
            <Link
              href={`/e/${eventSlug}/deck/${registration.deckEditToken}`}
              className="sub-link mt-3 inline-block text-sm underline"
            >
              Ver mi lista
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
