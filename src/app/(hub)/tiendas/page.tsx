import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export const dynamic = "force-dynamic";

function matchesQuery(
  q: string,
  store: { name: string; slug?: string | null; city?: string | null },
  events: { name: string }[]
) {
  const needle = q.toLowerCase();
  if (store.name.toLowerCase().includes(needle)) return true;
  if (store.slug?.toLowerCase().includes(needle)) return true;
  if (store.city?.toLowerCase().includes(needle)) return true;
  return events.some((e) => e.name.toLowerCase().includes(needle));
}

export default async function TiendasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

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

  const filtered = query
    ? stores.filter((s) =>
        matchesQuery(query, s, byStore.get(s._id.toString()) ?? [])
      )
    : stores;

  return (
    <PageShell subtitle="Tiendas del hub" area="public">
      <h1 className="mb-1 text-lg font-bold">Tiendas</h1>
      {query && (
        <p className="mb-4 text-sm text-sky-100/45">
          Resultados para &ldquo;{query}&rdquo;
          {filtered.length === 0 && " — sin coincidencias"}
        </p>
      )}
      {!query && <div className="mb-4" />}
      {filtered.length === 0 ? (
        <p className="text-sm text-sky-100/50">
          {query
            ? "No encontramos tiendas ni torneos con ese término."
            : "Aún no hay tiendas registradas."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((s) => (
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
