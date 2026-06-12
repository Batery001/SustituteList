import Link from "next/link";
import { DeckBuilder } from "@/components/deck/DeckBuilder";
import { routes } from "@/lib/routes";

export default function BuildDeckPage() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-sky-500/20 pb-3">
        <span className="rounded-lg bg-teal-600/20 px-3 py-1.5 text-sm font-medium text-teal-200">
          Armar mazo
        </span>
        <Link
          href={routes.player.newDeck}
          className="rounded-lg px-3 py-1.5 text-sm text-sky-200/60 hover:bg-sky-950/50"
        >
          Pegar lista
        </Link>
      </div>
      <DeckBuilder />
    </div>
  );
}
