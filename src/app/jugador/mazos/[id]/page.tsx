import { DeckEditLoader } from "@/components/DeckEditLoader";

export default async function EditarMazoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DeckEditLoader deckId={id} />;
}
