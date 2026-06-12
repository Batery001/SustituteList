"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EventDeckInline } from "@/components/event/EventDeckInline";
import { EventDeckStep } from "@/components/event/EventDeckStep";
import { OnlinePaymentPanel } from "@/components/OnlinePaymentPanel";
import { Button } from "@/components/ui/Button";
import { formatDivision } from "@/lib/division";
import {
  getEventRegistrationToken,
  saveEventRegistrationToken,
} from "@/lib/event-registration-storage";

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

type RegistrationState = {
  accessToken: string;
  paymentStatus: string;
  deckEditToken: string | null;
  playerName?: string;
  popId?: string;
};

type Step = "register" | "pay" | "decklist" | "done" | "closed";

function formatFee(pesos: number): string {
  if (pesos <= 0) return "Gratis";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

function getStep(
  canSubmit: boolean,
  registration: RegistrationState | null,
  entryFeeCents: number
): Step {
  if (!canSubmit && !registration?.deckEditToken) return "closed";
  if (!registration) return "register";
  if (entryFeeCents > 0 && registration.paymentStatus !== "paid") return "pay";
  if (!registration.deckEditToken) return "decklist";
  return "done";
}

export function EventRegistrationFlow(props: EventRegistrationFlowProps) {
  const {
    eventSlug,
    canSubmit,
    deadlineLabel,
    entryFeeCents,
    storeName,
    storeAddress,
    storeCity,
    storePhone,
  } = props;

  const searchParams = useSearchParams();
  const paymentNotice = useMemo(() => {
    const q = searchParams.get("payment");
    if (q === "success") return "Pago confirmado. Ya puedes subir tu lista.";
    if (q === "pending") return "Pago pendiente de confirmación.";
    if (q === "failure") return "El pago no se completó. Puedes intentar de nuevo.";
    if (q === "error") return "Hubo un error al confirmar el pago.";
    return null;
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<{
    playerName: string;
    popId: string;
    division: string;
  } | null>(null);
  const [registration, setRegistration] = useState<RegistrationState | null>(
    null
  );
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPopId, setGuestPopId] = useState("");
  const [guestBirth, setGuestBirth] = useState("");
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onlinePaymentsAvailable, setOnlinePaymentsAvailable] = useState(false);

  const resolveRegistration = useCallback(
    async (
      apiRegistration: RegistrationState | null | undefined,
      storedToken: string | null
    ): Promise<RegistrationState | null> => {
      if (apiRegistration) return apiRegistration;
      if (!storedToken) return null;

      const res = await fetch(`/api/registrations/${storedToken}`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        accessToken: storedToken,
        paymentStatus: data.registration.paymentStatus,
        deckEditToken: data.deckEditToken ?? null,
        playerName: data.registration.playerName,
        popId: data.registration.popId,
      };
    },
    []
  );

  const load = useCallback(async () => {
    const storedToken = getEventRegistrationToken(eventSlug);
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

    const reg = await resolveRegistration(
      evData.myRegistration,
      storedToken
    );
    setRegistration(reg);
    if (reg?.accessToken) {
      saveEventRegistrationToken(eventSlug, reg.accessToken);
    }
    setOnlinePaymentsAvailable(evData.onlinePaymentsAvailable ?? false);
    setLoading(false);
  }, [eventSlug, resolveRegistration]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedToken = getEventRegistrationToken(eventSlug);
      const [meRes, evRes] = await Promise.all([
        fetch("/api/auth/player/me"),
        fetch(`/api/events/${eventSlug}`),
      ]);
      if (cancelled) return;
      const meData = await meRes.json();
      const evData = await evRes.json();

      if (meData.player) {
        setPlayer({
          playerName: meData.player.playerName,
          popId: meData.player.popId,
          division: meData.player.division,
        });
      }

      const reg = await resolveRegistration(
        evData.myRegistration,
        storedToken
      );
      if (cancelled) return;
      setRegistration(reg);
      if (reg?.accessToken) {
        saveEventRegistrationToken(eventSlug, reg.accessToken);
      }
      setOnlinePaymentsAvailable(evData.onlinePaymentsAvailable ?? false);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventSlug, resolveRegistration]);

  const step = getStep(canSubmit, registration, entryFeeCents);

  const displayName =
    registration?.playerName ?? player?.playerName ?? guestName;
  const displayPopId = registration?.popId ?? player?.popId ?? guestPopId;

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
        saveEventRegistrationToken(eventSlug, data.accessToken);
        setRegistration({
          accessToken: data.accessToken,
          paymentStatus: data.paymentStatus ?? "pending",
          deckEditToken: null,
          playerName: displayName,
          popId: displayPopId,
        });
        setError("Ya estabas inscrito. Continúa con el siguiente paso.");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "No se pudo inscribir");
        return;
      }

      const token = data.registration.accessToken as string;
      saveEventRegistrationToken(eventSlug, token);
      setRegistration({
        accessToken: token,
        paymentStatus: data.registration.paymentStatus,
        deckEditToken: null,
        playerName: player?.playerName ?? guestName,
        popId: player?.popId ?? guestPopId,
      });
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
    { id: "register", label: "Inscripción", num: 1 },
    { id: "pay", label: entryFeeCents > 0 ? "Pago" : "Confirmado", num: 2 },
    { id: "decklist", label: "Tu mazo", num: 3 },
  ];

  return (
    <div className="space-y-6">
      <ol className="flex gap-2">
        {steps.map((s) => {
          const done =
            (s.id === "register" && registration) ||
            (s.id === "pay" &&
              (entryFeeCents <= 0 ||
                registration?.paymentStatus === "paid")) ||
            (s.id === "decklist" && registration?.deckEditToken);
          const active =
            (s.id === "register" && step === "register") ||
            (s.id === "pay" && step === "pay") ||
            (s.id === "decklist" &&
              (step === "decklist" || step === "done"));
          return (
            <li
              key={s.id}
              className={`flex flex-1 flex-col items-center rounded-xl border px-2 py-3 text-center ${
                done
                  ? "border-emerald-500/40 bg-emerald-950/25"
                  : active
                    ? "border-sky-500/50 bg-sky-950/40"
                    : "border-sky-500/15 bg-transparent"
              }`}
            >
              <span
                className={`mb-1 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-500/25 text-emerald-300"
                    : active
                      ? "bg-sky-500/25 text-sky-200"
                      : "bg-sky-950/60 text-sky-100/35"
                }`}
              >
                {done ? "✓" : s.num}
              </span>
              <span
                className={`text-[11px] font-medium leading-tight ${
                  done
                    ? "text-emerald-300"
                    : active
                      ? "text-sky-100"
                      : "text-sky-100/35"
                }`}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>

      {paymentNotice && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          {paymentNotice}
        </p>
      )}

      {step === "register" && (
        <section className="sub-panel rounded-xl p-5">
          <h2 className="text-lg font-bold text-sky-50">Inscribirse</h2>
          <p className="mt-1 text-sm text-sky-100/55">
            {formatFee(entryFeeCents)} · {storeName}
          </p>
          <p className="mt-2 text-xs text-sky-100/45">
            Todo en esta página: inscripción, pago y lista de 60 cartas.
          </p>

          {player ? (
            <div className="mt-4 rounded-lg border border-sky-500/20 bg-sky-950/30 p-4 text-sm">
              <p className="font-medium">{player.playerName}</p>
              <p className="text-sky-100/60">
                Pop {player.popId} · {formatDivision(player.division as "master")}
              </p>
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
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-sky-100/70">
                Con cuenta es más rápido en futuros torneos.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/auth/login?callbackUrl=${encodeURIComponent(`/e/${eventSlug}`)}`}
                  className="sub-btn-primary rounded-lg px-4 py-2 text-sm"
                >
                  Iniciar sesión
                </Link>
                <Link
                  href={`/auth/register?callbackUrl=${encodeURIComponent(`/e/${eventSlug}`)}`}
                  className="rounded-lg border border-sky-500/30 px-4 py-2 text-sm text-sky-200"
                >
                  Crear cuenta
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setGuestMode(true)}
                className="text-xs text-sky-100/45 underline"
              >
                Inscribirme sin cuenta
              </button>
            </div>
          )}

          {(player || guestMode) && (
            <form onSubmit={handleRegister} className="mt-4">
              {error && (
                <p
                  className={`mb-3 rounded-lg border p-3 text-sm ${
                    registration
                      ? "border-amber-500/30 bg-amber-950/30 text-amber-200"
                      : "border-red-800 bg-red-950/50 text-red-200"
                  }`}
                >
                  {error}
                </p>
              )}
              <Button type="submit" disabled={registering} className="w-full">
                {registering ? "Inscribiendo…" : "Confirmar inscripción"}
              </Button>
            </form>
          )}
        </section>
      )}

      {step === "pay" && registration && (
        <OnlinePaymentPanel
          registrationAccessToken={registration.accessToken}
          entryFeeCents={entryFeeCents}
          storeName={storeName}
          storeAddress={storeAddress}
          storeCity={storeCity}
          storePhone={storePhone}
          onlinePaymentsAvailable={onlinePaymentsAvailable}
          onRefresh={load}
        />
      )}

      {step === "decklist" && registration && (
        <section className="space-y-4">
          <div className="sub-panel rounded-xl p-4 text-sm text-emerald-300">
            Estás inscrito. Sube tu lista de 60 cartas para que la tienda la
            tenga lista antes del torneo.
          </div>
          <EventDeckStep
            eventSlug={eventSlug}
            registrationAccessToken={registration.accessToken}
            playerName={displayName}
            popId={displayPopId}
            deadlineLabel={deadlineLabel}
            onSubmitted={(deckEditToken) => {
              setRegistration((prev) =>
                prev ? { ...prev, deckEditToken } : prev
              );
            }}
          />
        </section>
      )}

      {step === "done" && registration?.deckEditToken && (
        <section className="space-y-4">
          <div className="sub-panel rounded-xl p-4 text-center">
            <p className="text-lg font-semibold text-emerald-300">
              Lista enviada
            </p>
            <p className="mt-1 text-sm text-sky-100/55">
              La tienda ya tiene tu mazo. Puedes cambiarlo aquí hasta{" "}
              {deadlineLabel}.
            </p>
          </div>
          <EventDeckInline
            deckEditToken={registration.deckEditToken}
            deadlineLabel={deadlineLabel}
          />
        </section>
      )}

      {step === "closed" && (
        <div className="sub-panel rounded-xl p-6 text-center">
          <p className="font-semibold text-sky-100">
            Inscripción o plazo de lista cerrado
          </p>
          {registration?.deckEditToken && (
            <div className="mt-4">
              <EventDeckInline
                deckEditToken={registration.deckEditToken}
                deadlineLabel={deadlineLabel}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
