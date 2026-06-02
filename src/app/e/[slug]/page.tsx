import { notFound } from "next/navigation";
import { BrandHeader } from "@/components/BrandHeader";
import { EventRegistrationFlow } from "@/components/EventRegistrationFlow";
import { EventTimePanel } from "@/components/EventTimePanel";
import { connectDB } from "@/lib/db";
import {
  formatDeadline,
  formatEventType,
  getStoreTimezone,
  isDeadlinePassed,
} from "@/lib/event-utils";
import { syncStoreTimezone } from "@/lib/sync-store-timezone";
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
  if (store) await syncStoreTimezone(store._id.toString());
  const timezone = getStoreTimezone(store?.timezone);
  const deadline = new Date(event.decklistDeadlineAt);
  const deadlinePassed = isDeadlinePassed(deadline);
  const canSubmit = event.status === "open" && !deadlinePassed;
  const deadlineLabel = formatDeadline(deadline, timezone);

  const typeLabel = formatEventType(
    event.type as "cup" | "challenge" | "local"
  );

  return (
    <div className="mx-auto min-h-full max-w-lg">
      <BrandHeader subtitle={`${typeLabel} · ${event.name}`} />
      <main className="px-4 py-6">
        <EventTimePanel
          eventName={event.name}
          eventTypeLabel={typeLabel}
          deadline={deadline}
          timeZone={timezone}
          canSubmit={canSubmit}
        />
        <EventRegistrationFlow
          eventSlug={slug}
          canSubmit={canSubmit}
          deadlineLabel={deadlineLabel}
          entryFeeCents={event.entryFeeCents ?? store?.defaultEntryFeeCents ?? 0}
          storeName={store?.name ?? "Tienda"}
          storeAddress={store?.address}
          storeCity={store?.city}
          storePhone={store?.phone}
        />
      </main>
    </div>
  );
}
