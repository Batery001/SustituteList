"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CancelAttendanceButton } from "@/components/event/CancelAttendanceButton";
import { OnlinePaymentPanel } from "@/components/event/OnlinePaymentPanel";
import { formatDivision, type Division } from "@/lib/division";
import { saveEventRegistrationToken } from "@/lib/event-registration-storage";

type StatusData = {
  registration: {
    playerName: string;
    popId: string;
    division: Division;
    paymentStatus: string;
  };
  event: {
    name: string;
    slug: string;
  };
  deckEditToken?: string | null;
};

export function MiInscripcionStatus({
  eventSlug,
  accessToken,
}: {
  eventSlug: string;
  accessToken: string;
}) {
  const router = useRouter();
  const [data, setData] = useState<StatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/registrations/${accessToken}`);
    const json = (await res.json()) as StatusData & { error?: string };
    if (!res.ok) {
      setError(json.error ?? "No se encontró la inscripción");
      return;
    }
    setData(json);
  }, [accessToken]);

  useEffect(() => {
    saveEventRegistrationToken(eventSlug, accessToken);
    void load();
  }, [eventSlug, accessToken, load]);

  if (error) {
    return (
      <p className="rounded-xl border border-red-800 bg-red-950/50 p-4 text-sm text-red-200">
        {error}
      </p>
    );
  }

  if (!data) {
    return <p className="py-8 text-center text-sky-100/50">Cargando…</p>;
  }

  const confirmed = data.registration.paymentStatus === "paid";

  return (
    <div className="space-y-4">
      <section className="sub-panel rounded-xl p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
          Mi inscripción
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sky-50">{data.event.name}</p>
            <p className="mt-1 text-sm text-sky-100/60">
              {data.registration.playerName} · Pop {data.registration.popId} ·{" "}
              {formatDivision(data.registration.division)}
            </p>
          </div>
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              confirmed
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {confirmed ? "Asistencia confirmada" : "Pendiente"}
          </span>
        </div>
      </section>

      {!confirmed && (
        <OnlinePaymentPanel
          registrationAccessToken={accessToken}
          confirmed={confirmed}
          onConfirmed={load}
        />
      )}

      {data.deckEditToken && (
        <p className="text-center text-sm">
          <Link
            href={`/e/${eventSlug}/deck/${data.deckEditToken}`}
            className="text-sky-300 underline"
          >
            Ver o modificar tu lista
          </Link>
        </p>
      )}

      <CancelAttendanceButton
        accessToken={accessToken}
        eventSlug={eventSlug}
        onCancelled={() => router.push(`/e/${eventSlug}`)}
      />

      <p className="pt-2 text-center text-sm">
        <Link href={`/e/${eventSlug}`} className="text-sky-400 underline">
          ← Volver al torneo
        </Link>
      </p>
    </div>
  );
}
