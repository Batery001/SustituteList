import { BrandHeader } from "@/components/BrandHeader";
import { DeckEditLoader } from "@/components/DeckEditLoader";

export default async function EditarMazoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Editar mazo" />
      <main className="px-4 py-6">
        <DeckEditLoader deckId={id} />
      </main>
    </div>
  );
}
