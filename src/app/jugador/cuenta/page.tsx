import { BrandHeader } from "@/components/BrandHeader";
import { PlayerAccountPage } from "@/components/PlayerAccountPage";

export default function PlayerAccountRoute() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Mi cuenta" />
      <main className="px-4 py-6">
        <PlayerAccountPage />
      </main>
    </div>
  );
}
