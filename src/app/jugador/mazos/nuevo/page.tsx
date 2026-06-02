import { BrandHeader } from "@/components/BrandHeader";
import { DeckEditorForm } from "@/components/DeckEditorForm";

export default function NuevoMazoPage() {
  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle="Nuevo mazo" />
      <main className="px-4 py-6">
        <DeckEditorForm />
      </main>
    </div>
  );
}
