"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TournamentDeckEditor } from "@/components/deck/TournamentDeckEditor";
import type { PlayerRegistrationRow } from "@/lib/player/get-player-registrations";
import { getValidationErrors } from "@/lib/validation-display";

export function DeckUploadForm({
  registration,
}: {
  registration: PlayerRegistrationRow;
}) {
  const router = useRouter();
  const [initialRawText, setInitialRawText] = useState("");
  const [loadingDeck, setLoadingDeck] = useState(registration.hasDecklist);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const loadExistingDeck = useCallback(async () => {
    if (!registration.deckEditToken) {
      setLoadingDeck(false);
      return;
    }
    const res = await fetch(`/api/submissions/${registration.deckEditToken}`);
    if (res.ok) {
      const data = await res.json();
      setInitialRawText(data.submission?.rawText ?? "");
    }
    setLoadingDeck(false);
  }, [registration.deckEditToken]);

  useEffect(() => {
    if (registration.hasDecklist) {
      void loadExistingDeck();
    }
  }, [registration.hasDecklist, loadExistingDeck]);

  async function handleSave(rawText: string) {
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/registrations/upload-deck", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId: registration.id,
        rawText,
      }),
    });

    const data = (await res.json()) as {
      error?: string;
      validation?: { errors?: string[]; errorMessages?: string[] };
    };

    setSubmitting(false);

    if (!res.ok) {
      setError(
        data.validation
          ? getValidationErrors(data.validation).join(" ")
          : (data.error ?? "No se pudo enviar la lista")
      );
      return;
    }

    setSuccess(true);
    setInitialRawText(rawText);
    router.refresh();
  }

  if (!registration.canUploadDeck) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-amber-300">
          {registration.deadlinePassed
            ? "Ya pasó la hora límite para enviar o modificar tu decklist."
            : registration.paymentStatus !== "paid"
              ? "Debes completar el pago antes de subir tu mazo."
              : "Este torneo ya no acepta listas."}
        </p>
        <Link
          href="/dashboard/player"
          className="text-sm text-sky-400 underline"
        >
          ← Volver al panel
        </Link>
      </div>
    );
  }

  if (loadingDeck) {
    return (
      <p className="py-8 text-center text-sm text-sky-100/50">
        Cargando tu lista…
      </p>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/dashboard/player"
          className="text-xs text-sky-100/45 underline hover:text-sky-300"
        >
          ← Mis torneos
        </Link>
        <h1 className="mt-2 text-lg font-semibold text-sky-50">
          {registration.hasDecklist ? "Cambiar decklist" : "Subir decklist"}
        </h1>
        <p className="mt-1 text-sm text-sky-100/55">{registration.eventName}</p>
      </div>

      {success && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-300">
          ¡Lista enviada correctamente!
        </p>
      )}

      <TournamentDeckEditor
        key={initialRawText}
        initialRawText={initialRawText}
        onSave={handleSave}
        onCancel={() => router.push("/dashboard/player")}
        saving={submitting}
        error={error}
        saveLabel={
          registration.hasDecklist
            ? "Guardar nueva lista"
            : "Confirmar y enviar lista"
        }
      />
    </div>
  );
}
