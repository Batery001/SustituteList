"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EventDeckStep } from "@/components/event/EventDeckStep";
import { CancelAttendanceButton } from "@/components/event/CancelAttendanceButton";
import { OnlinePaymentPanel } from "@/components/OnlinePaymentPanel";
import { Button } from "@/components/ui/Button";
import { formatDivision } from "@/lib/division";
import type { FamilyMemberDto } from "@/lib/player/family-members";
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
  allowedRegulationMarks?: string[];
}

type RegistrationState = {
  accessToken: string;
  paymentStatus: string;
  deckEditToken: string | null;
  playerName?: string;
  popId?: string;
  familyMemberId?: string | null;
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
  entryFeeCents: number,
  forceNew: boolean
): Step {
  if (forceNew) return "register";
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
    allowedRegulationMarks = [],
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
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberDto[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<RegistrationState[]>(
    []
  );
  const [registration, setRegistration] = useState<RegistrationState | null>(
    null
  );
  const [forceNew, setForceNew] = useState(false);
  /** null = yo; string = id del familiar */
  const [entrantId, setEntrantId] = useState<string | null>(null);
  const [guestMode, setGuestMode] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPopId, setGuestPopId] = useState("");
  const [guestBirth, setGuestBirth] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [recoverMode, setRecoverMode] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        familyMemberId: data.registration.familyMemberId ?? null,
      };
    },
    []
  );

  const applyLoaded = useCallback(
    async (
      meData: {
        player?: {
          playerName: string;
          popId: string;
          division: string;
          familyMembers?: FamilyMemberDto[];
        };
      },
      evData: {
        myRegistration?: RegistrationState | null;
        myRegistrations?: RegistrationState[];
      }
    ) => {
      const storedToken = getEventRegistrationToken(eventSlug);

      if (meData.player) {
        setPlayer({
          playerName: meData.player.playerName,
          popId: meData.player.popId,
          division: meData.player.division,
        });
        setFamilyMembers(meData.player.familyMembers ?? []);
      }

      const regs: RegistrationState[] = Array.isArray(evData.myRegistrations)
        ? evData.myRegistrations
        : evData.myRegistration
          ? [evData.myRegistration]
          : [];
      setMyRegistrations(regs);

      const byToken = storedToken
        ? regs.find((r) => r.accessToken === storedToken)
        : undefined;
      const preferred =
        byToken ??
        regs.find((r) => !r.familyMemberId) ??
        regs[0] ??
        null;

      const reg = await resolveRegistration(
        preferred ?? evData.myRegistration,
        preferred ? null : storedToken
      );
      setRegistration(reg);
      setForceNew(false);
      if (reg?.accessToken) {
        saveEventRegistrationToken(eventSlug, reg.accessToken);
      }
      if (reg?.familyMemberId) {
        setEntrantId(reg.familyMemberId);
      } else {
        setEntrantId(null);
      }
    },
    [eventSlug, resolveRegistration]
  );

  const load = useCallback(async () => {
    const [meRes, evRes] = await Promise.all([
      fetch("/api/auth/player/me"),
      fetch(`/api/events/${eventSlug}`),
    ]);
    const meData = await meRes.json();
    const evData = await evRes.json();
    await applyLoaded(meData, evData);
    setLoading(false);
  }, [applyLoaded, eventSlug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [meRes, evRes] = await Promise.all([
        fetch("/api/auth/player/me"),
        fetch(`/api/events/${eventSlug}`),
      ]);
      if (cancelled) return;
      const meData = await meRes.json();
      const evData = await evRes.json();
      await applyLoaded(meData, evData);
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [applyLoaded, eventSlug]);

  const registeredKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const r of myRegistrations) {
      keys.add(r.familyMemberId ?? "self");
    }
    return keys;
  }, [myRegistrations]);

  const selfTaken = registeredKeys.has("self");
  const canRegisterSomeone =
    !selfTaken || familyMembers.some((m) => !registeredKeys.has(m.id));

  const step = getStep(canSubmit, registration, entryFeeCents, forceNew);

  const displayName =
    registration?.playerName ?? player?.playerName ?? guestName;
  const displayPopId = registration?.popId ?? player?.popId ?? guestPopId;

  function selectRegistration(reg: RegistrationState) {
    setForceNew(false);
    setRegistration(reg);
    setEntrantId(reg.familyMemberId ?? null);
    saveEventRegistrationToken(eventSlug, reg.accessToken);
    setError(null);
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRegistering(true);

    const body = player
      ? {
          eventSlug,
          ...(entrantId ? { familyMemberId: entrantId } : {}),
        }
      : {
          eventSlug,
          playerName: guestName,
          popId: guestPopId,
          birthDate: guestBirth,
          email: guestEmail,
        };

    try {
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ACCOUNT_EXISTS") {
          setError(
            `${data.error ?? "Ya tienes cuenta."} Entra con tu correo.`
          );
          return;
        }
        setError(data.error ?? "No se pudo inscribir");
        return;
      }

      const token = data.registration.accessToken as string;
      const next: RegistrationState = {
        accessToken: token,
        paymentStatus: data.registration.paymentStatus,
        deckEditToken: data.deckEditToken ?? null,
        playerName:
          data.registration.playerName ?? player?.playerName ?? guestName,
        popId: data.registration.popId ?? player?.popId ?? guestPopId,
        familyMemberId: data.registration.familyMemberId ?? entrantId,
      };
      saveEventRegistrationToken(eventSlug, token);
      setRegistration(next);
      setMyRegistrations((prev) => {
        const without = prev.filter((r) => r.accessToken !== token);
        return [...without, next];
      });
      setForceNew(false);
    } catch {
      setError("Error de red. Intenta de nuevo.");
    } finally {
      setRegistering(false);
    }
  }

  async function handleRecover(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRegistering(true);
    try {
      const res = await fetch("/api/registrations/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          popId: guestPopId,
          birthDate: guestBirth,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo recuperar la inscripción");
        return;
      }
      const token = data.registration.accessToken as string;
      saveEventRegistrationToken(eventSlug, token);
      setRegistration({
        accessToken: token,
        paymentStatus: data.registration.paymentStatus,
        deckEditToken: data.deckEditToken ?? null,
        playerName: data.registration.playerName,
        popId: data.registration.popId,
      });
      setForceNew(false);
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
    { id: "pay", label: entryFeeCents > 0 ? "Asistencia" : "Confirmado", num: 2 },
    { id: "decklist", label: "Tu mazo", num: 3 },
  ];

  const selectedFamily = entrantId
    ? familyMembers.find((m) => m.id === entrantId)
    : null;

  return (
    <div className="space-y-6">
      {player && myRegistrations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {myRegistrations.map((r) => {
            const active =
              !forceNew && registration?.accessToken === r.accessToken;
            const label = r.familyMemberId
              ? r.playerName ?? "Familiar"
              : "Yo";
            return (
              <button
                key={r.accessToken}
                type="button"
                onClick={() => selectRegistration(r)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  active
                    ? "border-sky-400/60 bg-sky-500/20 text-sky-50"
                    : "border-sky-500/20 text-sky-100/60 hover:border-sky-500/40"
                }`}
              >
                {label}
              </button>
            );
          })}
          {canRegisterSomeone && canSubmit && (
            <button
              type="button"
              onClick={() => {
                setForceNew(true);
                setRegistration(null);
                setError(null);
                if (!registeredKeys.has("self")) {
                  setEntrantId(null);
                } else {
                  const next = familyMembers.find(
                    (m) => !registeredKeys.has(m.id)
                  );
                  setEntrantId(next?.id ?? null);
                }
              }}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                forceNew
                  ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                  : "border-dashed border-sky-500/30 text-sky-100/55 hover:border-sky-400/50"
              }`}
            >
              + Inscribir a otro
            </button>
          )}
        </div>
      )}

      <ol className="flex gap-2">
        {steps.map((s) => {
          const done =
            !forceNew &&
            ((s.id === "register" && registration) ||
              (s.id === "pay" &&
                (entryFeeCents <= 0 ||
                  registration?.paymentStatus === "paid")) ||
              (s.id === "decklist" && registration?.deckEditToken));
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
            Todo en esta página: inscripción, asistencia y lista de 60 cartas.
          </p>

          {player ? (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-sky-200/80">
                ¿A quién inscribes?
                <select
                  value={entrantId ?? "self"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setEntrantId(v === "self" ? null : v);
                    setError(null);
                  }}
                  className="sub-input mt-1.5 w-full px-3 py-2 text-sm"
                >
                  <option value="self" disabled={selfTaken}>
                    Yo — {player.playerName} (Pop {player.popId})
                    {selfTaken ? " · ya inscrito" : ""}
                  </option>
                  {familyMembers.map((m) => {
                    const taken = registeredKeys.has(m.id);
                    return (
                      <option key={m.id} value={m.id} disabled={taken}>
                        {m.playerName} (Pop {m.popId})
                        {taken ? " · ya inscrito" : ""}
                      </option>
                    );
                  })}
                </select>
              </label>

              {selectedFamily ? (
                <div className="rounded-lg border border-sky-500/20 bg-sky-950/30 p-3 text-sm">
                  <p className="font-medium text-sky-50">
                    {selectedFamily.playerName}
                  </p>
                  <p className="text-sky-100/60">
                    Pop {selectedFamily.popId} · nac.{" "}
                    {selectedFamily.birthDate}
                  </p>
                </div>
              ) : !selfTaken ? (
                <div className="rounded-lg border border-sky-500/20 bg-sky-950/30 p-3 text-sm">
                  <p className="font-medium">{player.playerName}</p>
                  <p className="text-sky-100/60">
                    Pop {player.popId} ·{" "}
                    {formatDivision(player.division as "master")}
                  </p>
                </div>
              ) : null}

              <p className="text-xs text-sky-100/45">
                Para un hijo sin correo, agrégalo en{" "}
                <Link
                  href="/dashboard/player/profile"
                  className="text-sky-300 underline"
                >
                  tu perfil → Familia
                </Link>{" "}
                con su Pop ID.
              </p>

              {!canRegisterSomeone && (
                <p className="text-sm text-amber-200">
                  Ya están ustedes inscritos en este torneo (tú y tus
                  familiares).
                </p>
              )}
            </div>
          ) : guestMode ? (
            <div className="mt-4 space-y-3">
              {recoverMode ? (
                <p className="text-xs text-sky-100/55">
                  Usa el mismo Pop ID y fecha de nacimiento de cuando te
                  inscribiste.
                </p>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="sub-input w-full px-3 py-2 text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Correo (te llega la confirmación)"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="sub-input w-full px-3 py-2 text-sm"
                  />
                </>
              )}
              <input
                type="text"
                placeholder="Pop ID (uno por persona)"
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
              <button
                type="button"
                onClick={() => {
                  setRecoverMode((v) => !v);
                  setError(null);
                }}
                className="text-xs text-sky-100/45 underline"
              >
                {recoverMode
                  ? "Quiero inscribirme"
                  : "Ya me inscribí sin cuenta"}
              </button>
            </div>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-sky-100/70">
                Con cuenta es más rápido en futuros torneos. También puedes
                agregar familiares (hijos con Pop ID, sin correo) desde el
                perfil.
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

          {(player || guestMode) && canRegisterSomeone && (
            <form
              onSubmit={recoverMode ? handleRecover : handleRegister}
              className="mt-4"
            >
              {error && (
                <p
                  className={`mb-3 rounded-lg border p-3 text-sm ${
                    registration
                      ? "border-amber-500/30 bg-amber-950/30 text-amber-200"
                      : "border-red-800 bg-red-950/50 text-red-200"
                  }`}
                >
                  {error}
                  {error.includes("Inicia sesión") ||
                  error.includes("cuenta") ? (
                    <>
                      {" "}
                      <Link
                        href={`/auth/login?callbackUrl=${encodeURIComponent(`/e/${eventSlug}`)}`}
                        className="underline"
                      >
                        Ir al login
                      </Link>
                    </>
                  ) : null}
                </p>
              )}
              <Button
                type="submit"
                disabled={
                  registering ||
                  (Boolean(player) &&
                    ((entrantId === null && selfTaken) ||
                      (entrantId !== null && registeredKeys.has(entrantId))))
                }
                className="w-full"
              >
                {registering
                  ? "…"
                  : recoverMode
                    ? "Recuperar inscripción"
                    : entrantId
                      ? `Inscribir a ${selectedFamily?.playerName ?? "familiar"}`
                      : "Confirmar inscripción"}
              </Button>
            </form>
          )}
        </section>
      )}

      {step === "pay" && registration && (
        <OnlinePaymentPanel
          registrationAccessToken={registration.accessToken}
          confirmed={registration.paymentStatus === "paid"}
          onConfirmed={load}
        />
      )}

      {step === "decklist" && registration && (
        <section className="space-y-4">
          <div className="sub-panel rounded-xl p-4 text-sm text-emerald-300">
            {registration.familyMemberId
              ? `${displayName} está inscrito/a. Sube su lista de 60 cartas.`
              : "Estás inscrito. Sube tu lista de 60 cartas para que la tienda la tenga lista antes del torneo."}
          </div>
          <EventDeckStep
            eventSlug={eventSlug}
            registrationAccessToken={registration.accessToken}
            playerName={displayName}
            popId={displayPopId}
            deadlineLabel={deadlineLabel}
            allowedRegulationMarks={allowedRegulationMarks}
            onSubmitted={(deckEditToken) => {
              setRegistration((prev) =>
                prev ? { ...prev, deckEditToken } : prev
              );
              setMyRegistrations((prev) =>
                prev.map((r) =>
                  r.accessToken === registration.accessToken
                    ? { ...r, deckEditToken }
                    : r
                )
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
              La tienda ya tiene el mazo de {displayName}. Puedes cambiarlo
              hasta {deadlineLabel}.
            </p>
            <Link
              href={`/e/${eventSlug}/deck/${registration.deckEditToken}`}
              className="sub-btn-primary mt-4 inline-flex rounded-xl px-4 py-3 text-sm font-semibold"
            >
              Cambiar lista
            </Link>
          </div>
        </section>
      )}

      {step === "closed" && (
        <div className="sub-panel rounded-xl p-6 text-center">
          <p className="font-semibold text-sky-100">
            Inscripción o plazo de lista cerrado
          </p>
          {registration?.deckEditToken && (
            <p className="mt-3 text-sm text-sky-100/55">
              La lista ya está en la tienda. No se muestra en público.
            </p>
          )}
        </div>
      )}

      {registration && step !== "register" && (
        <CancelAttendanceButton
          accessToken={registration.accessToken}
          eventSlug={eventSlug}
          onCancelled={() => {
            const token = registration.accessToken;
            setMyRegistrations((prev) =>
              prev.filter((r) => r.accessToken !== token)
            );
            setRegistration(null);
            setForceNew(false);
            setError(null);
          }}
        />
      )}
    </div>
  );
}
