import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { EventSubmitForm } from "@/components/EventSubmitForm";
import { connectDB } from "@/lib/db";
import { formatDeadline, formatEventType, isDeadlinePassed } from "@/lib/event-utils";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export const dynamic = "force-dynamic";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!process.env.MONGODB_URI) {
    return (
      <div className="p-8 text-center text-red-400">
        Base de datos no configurada. Copia .env.example a .env.local
      </div>
    );
  }

  await connectDB();

  const event = await Event.findOne({ slug }).lean();
  if (!event) notFound();

  const store = await Store.findById(event.storeId).lean();
  const timezone = store?.timezone ?? "UTC";
  const deadlinePassed = isDeadlinePassed(new Date(event.decklistDeadlineAt));
  const canSubmit = event.status === "open" && !deadlinePassed;
  const deadlineLabel = formatDeadline(
    new Date(event.decklistDeadlineAt),
    timezone
  );

  const typeLabel = formatEventType(
    event.type as "cup" | "challenge" | "local"
  );

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle={`${typeLabel} · ${event.name}`} />
      <main className="px-4 py-6">
        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-sm text-zinc-400">
          <p>
            <span className="text-zinc-300">Hora límite de listas:</span>{" "}
            {deadlineLabel}
          </p>
          {!canSubmit && (
            <p className="mt-2 font-medium text-amber-400">
              El envío de listas está cerrado para este torneo.
            </p>
          )}
        </div>
        <EventSubmitForm
          eventSlug={slug}
          canSubmit={canSubmit}
          deadlineLabel={deadlineLabel}
        />
      </main>
    </div>
  );
}
