"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DeckBuilder } from "@/components/deck/DeckBuilder";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

interface DeckEditorFormProps {
  deckId?: string;
  initialName?: string;
  initialRawText?: string;
  cancelHref?: string;
  loginCallbackUrl?: string;
}

export function DeckEditorForm({
  deckId,
  initialName = "",
  initialRawText = "",
  cancelHref = routes.player.decks,
  loginCallbackUrl = routes.player.newDeck,
}: DeckEditorFormProps) {
  const router = useRouter();
  const isNew = !deckId;
  const [name, setName] = useState(initialName);
  const [rawText, setRawText] = useState(initialRawText);
  const [mode, setMode] = useState<"paste" | "build">("paste");
  const [buildKey, setBuildKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isNew ? "/api/player/decks" : `/api/player/decks/${deckId}`;
    const method = isNew ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, rawText }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push(
            `/auth/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`
          );
          return;
        }
        setError(data.error ?? "No se pudo guardar");
        return;
      }

      router.push(cancelHref);
      router.refresh();
    } catch {
      setError("Error de red");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deckId || !confirm("¿Eliminar este mazo?")) return;
    setLoading(true);
    await fetch(`/api/player/decks/${deckId}`, { method: "DELETE" });
    router.push(cancelHref);
    router.refresh();
  }

  function openBuildMode() {
    setBuildKey((k) => k + 1);
    setMode("build");
    setError(null);
  }

  const nameField = (
    <div>
      <label className="mb-1 block text-sm font-medium text-sky-200/80">
        Nombre del mazo
      </label>
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ej. Charizard ex Standard"
        className="sub-input w-full px-3 py-3"
      />
    </div>
  );

  const modeTabs = (
    <div className="flex gap-2 border-b border-sky-500/20 pb-3">
      <button
        type="button"
        onClick={openBuildMode}
        className={`rounded-lg px-3 py-1.5 text-sm ${
          mode === "build"
            ? "bg-teal-600/20 font-medium text-teal-200"
            : "text-sky-200/60 hover:bg-sky-950/50"
        }`}
      >
        Armar mazo
      </button>
      <button
        type="button"
        onClick={() => setMode("paste")}
        className={`rounded-lg px-3 py-1.5 text-sm ${
          mode === "paste"
            ? "bg-teal-600/20 font-medium text-teal-200"
            : "text-sky-200/60 hover:bg-sky-950/50"
        }`}
      >
        Pegar lista
      </button>
    </div>
  );

  if (mode === "build") {
    return (
      <div className="space-y-5">
        {nameField}
        {modeTabs}
        <p className="text-xs text-sky-100/45">
          Buscá cartas, sumá o quitá copias y tocá «Usar esta lista» para volver
          al texto y guardar.
        </p>
        <DeckBuilder
          key={buildKey}
          initialRawText={rawText}
          onRawTextReady={(text) => {
            setRawText(text);
            setMode("paste");
            setError(null);
          }}
          applyListLabel="Usar esta lista"
        />
        <a
          href={cancelHref}
          className="block text-center text-sm text-sky-100/45 underline"
        >
          Cancelar
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {nameField}
      {modeTabs}

      <DecklistTextarea value={rawText} onChange={setRawText} disabled={loading} />

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando…" : isNew ? "Crear mazo" : "Guardar cambios"}
      </Button>

      {!isNew && (
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          disabled={loading}
          className="w-full"
        >
          Eliminar mazo
        </Button>
      )}

      <a
        href={cancelHref}
        className="block text-center text-sm text-sky-100/45 underline"
      >
        Cancelar
      </a>
    </form>
  );
}
