import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { connectDB } from "@/lib/db";
import { OPEN_EVENT_QUERY } from "@/lib/events/event-status";
import { formatEventType } from "@/lib/event-utils";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export const dynamic = "force-dynamic";

export default async function StorePublicPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;
  await connectDB();

  const store = await Store.findOne({ slug: storeSlug }).lean();
  if (!store) notFound();

  const events = await Event.find({ storeId: store._id, ...OPEN_EVENT_QUERY })
    .sort({ startsAt: 1 })
    .lean();

  return (
    <PageShell subtitle={store.name} area="public">
      <div className="space-y-4">
        <section className="sub-panel rounded-xl p-5">
          <h1 className="text-xl font-bold">{store.name}</h1>
          {(store.city || store.address) && (
            <p className="mt-1 text-sm text-sky-100/55">
              {[store.address, store.city].filter(Boolean).join(", ")}
              {store.phone ? ` · ${store.phone}` : ""}
            </p>
          )}
          {store.description && (
            <p className="mt-2 text-sm text-sky-100/70">{store.description}</p>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-semibold">Torneos abiertos</h2>
          {events.length === 0 ? (
            <p className="text-sm text-sky-100/50">
              No hay torneos publicados ahora.
            </p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.slug} className="sub-panel rounded-xl p-4">
                  <p className="font-medium">{e.name}</p>
                  <p className="text-xs text-sky-100/50">
                    {formatEventType(e.type as "cup" | "challenge" | "local")}
                  </p>
                  <Link
                    href={`/e/${e.slug}`}
                    className="sub-btn-primary mt-3 inline-block rounded-lg px-4 py-2 text-sm"
                  >
                    Inscribirme
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Link href="/tiendas" className="text-sm text-sky-100/45 underline">
          ← Todas las tiendas
        </Link>
      </div>
    </PageShell>
  );
}
