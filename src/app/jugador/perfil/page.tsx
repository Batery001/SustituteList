import { BrandHeader } from "@/components/BrandHeader";
import { PlayerProfileForm } from "@/components/PlayerProfileForm";

export default function PlayerProfilePage() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Perfil de jugador" />
      <main className="px-4 py-6">
        <PlayerProfileForm />
      </main>
    </div>
  );
}
