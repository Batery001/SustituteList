import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export const dynamic = "force-dynamic";

export default async function TiendasPage() {
  await connectDB();
  const stores = await Store.find({ slug: { $exists: true, $ne: "" } })
    .sort({ name: 1 })
    .lean();
  const openEvents = await Event.find({ status: "open" }).lean();
  const byStore = new Map<string, typeof openEvents>();
  for (const ev of openEvents) {
    const k = ev.storeId.toString();
    const arr = byStore.get(k) ?? [];
    arr.push(ev);
    byStore.set(k, arr);
  }

  return (
    <PageShell subtitle="Tiendas del hub" area="public">
      <h1 className="mb-4 text-lg font-bold">Tiendas</h1>
      {stores.length === 0 ? (
        <p className="text-sm text-sky-100/50">Aún no hay tiendas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {stores.map((s) => (
            <li key={s._id.toString()} className="sub-panel rounded-xl p-4">
              <Link href={`/t/${s.slug}`} className="font-bold text-sky-100">
                {s.name}
              </Link>
              {s.city && (
                <p className="text-xs text-sky-100/50">{s.city}</p>
              )}
              <ul className="mt-2 text-sm">
                {(byStore.get(s._id.toString()) ?? []).map((e) => (
                  <li key={e.slug}>
                    <Link href={`/e/${e.slug}`} className="text-sky-400 underline">
                      {e.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
