import Link from "next/link";
import { connectDB } from "@/lib/db";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";
import { HubHeroSection } from "@/components/hub/HubHeroSection";
import { EventCard } from "@/components/hub/EventCard";
import { StoreCard } from "@/components/hub/StoreCard";
import type { PublicEventDTO } from "@/types/models";

export async function HubHome({ events }: { events: PublicEventDTO[] }) {
  let stores: {
    name: string;
    slug: string;
    city: string;
    openEvents: { name: string; slug: string; type: string }[];
  }[] = [];

  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
      const storeDocs = await Store.find({ slug: { $exists: true, $ne: "" } })
        .sort({ name: 1 })
        .lean();
      const openEvents = await Event.find(OPEN_EVENT_QUERY).lean();
      const byStore = new Map<string, typeof openEvents>();
      for (const ev of openEvents) {
        const k = ev.storeId.toString();
        const arr = byStore.get(k) ?? [];
        arr.push(ev);
        byStore.set(k, arr);
      }
      stores = storeDocs.map((s) => ({
        name: s.name,
        slug: s.slug!,
        city: s.city ?? "",
        openEvents: (byStore.get(s._id.toString()) ?? []).map((e) => ({
          name: e.name,
          slug: e.slug,
          type: e.type,
        })),
      }));
    }
  } catch {
    // BD no configurada
  }

  const featuredForHero = events[0]
    ? { name: events[0].title, slug: events[0].slug }
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <HubHeroSection featuredEvent={featuredForHero} />

      <section>
        <h2 className="mb-3 font-semibold text-sky-100/90">Torneos activos</h2>
        {events.length === 0 ? (
          <p className="text-sm text-sky-100/50">
            No hay torneos próximos publicados.
          </p>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => (
              <EventCard key={ev.id} event={ev} />
            ))}
          </ul>
        )}
      </section>

      {stores.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-sky-100/90">Tiendas en el hub</h2>
            <Link href="/tiendas" className="text-xs text-sky-400 underline">
              Ver todas
            </Link>
          </div>
          <ul className="space-y-3">
            {stores.slice(0, 5).map((s) => (
              <StoreCard key={s.slug} {...s} />
            ))}
          </ul>
        </section>
      )}

      <section className="text-sm text-sky-100/50">
        <h3 className="font-semibold text-sky-100/90">¿Eres tienda?</h3>
        <p className="mt-1">
          <Link href="/tienda/registro" className="sub-link underline">
            Registra tu tienda
          </Link>{" "}
          y publica League Cups y Challenges.
        </p>
      </section>
    </div>
  );
}
