"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeckCategoryPreviewPanel } from "@/components/player/DeckCategoryPreviewPanel";
import { Button } from "@/components/ui/Button";
import { parsePokemonDecklist } from "@/lib/deckParser";
import type { PlayerRegistrationRow } from "@/lib/player/get-player-registrations";

const PLACEHOLDER = `Pokémon: 20
4 Charmander OBF 26
2 Charmeleon OBF 27
...

Trainer: 32
2 Boss's Orders PAL 172
4 Ultra Ball SVI 196
...

Energy: 8
12 Basic Fire Energy`;

export function DeckUploadForm({
  registration,
}: {
  registration: PlayerRegistrationRow;
}) {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [parseResult, setParseResult] = useState<ReturnType<
    typeof parsePokemonDecklist
  > | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleValidate() {
    setError(null);
    setSuccess(false);
    const result = parsePokemonDecklist(rawText);
    setParseResult(result);
    if (!result.isValid) {
      setError(result.errors.join(" "));
    }
  }

  async function handleSubmit() {
    if (!parseResult?.isValid) {
      handleValidate();
      return;
    }

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
      validation?: { errors?: string[] };
    };

    setSubmitting(false);

    if (!res.ok) {
      const validationErrors = data.validation?.errors?.join(" ");
      setError(validationErrors ?? data.error ?? "No se pudo enviar la lista");
      return;
    }

    setSuccess(true);
    router.push("/dashboard/player");
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
          {registration.hasDecklist ? "Modificar decklist" : "Subir decklist"}
        </h1>
        <p className="mt-1 text-sm text-sky-100/55">{registration.eventName}</p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-sky-200/80">
          Pega tu mazo exportado
        </span>
        <textarea
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setParseResult(null);
            setError(null);
            setSuccess(false);
          }}
          placeholder={PLACEHOLDER}
          rows={14}
          className="sub-input w-full resize-y px-3 py-3 font-mono text-sm leading-relaxed"
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <p className="mt-2 text-xs text-sky-100/40">
          Formato estándar:{" "}
          <span className="font-mono">4 Nombre SET 123</span> · Energías:{" "}
          <span className="font-mono">12 Basic Fire Energy</span>
        </p>
      </label>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {parseResult?.warnings.length ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-950/30 p-3 text-xs text-amber-200">
          {parseResult.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      ) : null}

      {parseResult?.isValid && (
        <DeckCategoryPreviewPanel
          categories={parseResult.categories}
          cardCount={parseResult.cardCount}
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          className="flex-1"
          onClick={handleValidate}
          disabled={!rawText.trim()}
        >
          Validar Mazo
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={!parseResult?.isValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Enviando…" : "Confirmar y Enviar Lista"}
        </Button>
      </div>

      {success && (
        <p className="text-sm text-emerald-400">¡Lista enviada correctamente!</p>
      )}
    </div>
  );
}
