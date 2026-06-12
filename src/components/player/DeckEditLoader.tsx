"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DeckEditorForm } from "@/components/DeckEditorForm";

export function DeckEditLoader({ deckId }: { deckId: string }) {
  const router = useRouter();
  const [deck, setDeck] = useState<{ name: string; rawText: string } | null>(
    null
  );

  useEffect(() => {
    fetch(`/api/player/decks/${deckId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.deck) {
          router.push("/dashboard/player/decks");
          return;
        }
        setDeck({ name: data.deck.name, rawText: data.deck.rawText });
      });
  }, [deckId, router]);

  if (!deck) {
    return <p className="py-8 text-center text-sky-100/50">Cargando mazo…</p>;
  }

  return (
    <DeckEditorForm
      deckId={deckId}
      initialName={deck.name}
      initialRawText={deck.rawText}
    />
  );
}
