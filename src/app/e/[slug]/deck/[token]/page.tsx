import { BrandHeader } from "@/components/BrandHeader";
import { DeckEditPage } from "@/components/DeckEditPage";

export default async function PlayerDeckPage({
  params,
}: {
  params: Promise<{ slug: string; token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Mi lista" />
      <main className="px-4 py-6">
        <DeckEditPage token={token} />
      </main>
    </div>
  );
}
