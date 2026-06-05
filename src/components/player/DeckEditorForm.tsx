"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DecklistTextarea } from "@/components/DecklistTextarea";
import { Button } from "@/components/ui/Button";
interface DeckEditorFormProps {
  deckId?: string;
  initialName?: string;
  initialRawText?: string;
  cancelHref?: string;
}

export function DeckEditorForm({
  deckId,
  initialName = "",
  initialRawText = "",
  cancelHref = "/jugador/mazos",
}: DeckEditorFormProps) {
  const router = useRouter();
  const isNew = !deckId;
  const [name, setName] = useState(initialName);
  const [rawText, setRawText] = useState(initialRawText);
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
          router.push("/auth/login?callbackUrl=/jugador/mazos/nuevo");
          return;
        }
        setError(data.error ?? "No se pudo guardar");
        return;
      }

      router.push("/jugador/mazos");
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
    router.push("/jugador/mazos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <DecklistTextarea value={rawText} onChange={setRawText} disabled={loading} />

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

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
