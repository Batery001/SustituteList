import { BrandHeader } from "@/components/BrandHeader";
import { PlayerDecksPage } from "@/components/PlayerDecksPage";

export default function MazosPage() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Mis mazos" />
      <main className="px-4 py-6">
        <PlayerDecksPage />
      </main>
    </div>
  );
}
