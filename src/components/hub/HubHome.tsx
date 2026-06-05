import Link from "next/link";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";
import { StoreCard } from "@/components/hub/StoreCard";
import { Logo } from "@/components/layout/Logo";

export async function HubHome() {
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
      const openEvents = await Event.find({ status: "open" }).lean();
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

  const featuredEvent = stores.flatMap((s) => s.openEvents)[0];

  return (
    <div className="flex flex-col gap-6">
      <section className="sub-panel relative overflow-hidden rounded-2xl p-6">
        <div
          className="pointer-events-none absolute -right-2 top-2 h-24 w-24 opacity-20"
          aria-hidden
        >
          <Logo size="lg" showName={false} href={null} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
          Hub · Pokémon TCG
        </p>
        <h1 className="mt-1 text-xl font-bold text-sky-50">
          Torneos, inscripciones y listas en un solo lugar
        </h1>
        <p className="mt-2 text-sm text-sky-100/55">
          Encuentra tiendas, inscríbete, paga y sube tu decklist Standard.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/login"
            className="sub-btn-primary rounded-xl px-6 py-3 text-center text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/tiendas"
            className="rounded-xl border border-sky-500/30 px-6 py-3 text-center text-sm text-sky-200"
          >
            Ver tiendas
          </Link>
        </div>
        {featuredEvent && (
          <Link
            href={`/e/${featuredEvent.slug}`}
            className="mt-4 block text-sm text-sky-400 underline"
          >
            Torneo destacado: {featuredEvent.name} →
          </Link>
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
