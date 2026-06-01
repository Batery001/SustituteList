import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let activeEvent: { name: string; slug: string } | null = null;

  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
      const event = await Event.findOne({ status: "open" })
        .sort({ createdAt: -1 })
        .lean();
      if (event) {
        activeEvent = { name: event.name, slug: event.slug };
      }
    }
  } catch {
    // BD no configurada
  }

  return (
    <div className="mx-auto min-h-full max-w-lg flex-col">
      <BrandHeader subtitle="Registro de mazos Standard para ligas locales" />
      <main className="flex flex-1 flex-col gap-6 px-4 py-8">
        {activeEvent ? (
          <section className="rounded-2xl border border-amber-800/50 bg-gradient-to-b from-amber-950/40 to-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
              Torneo activo
            </p>
            <h2 className="mt-1 text-xl font-bold">{activeEvent.name}</h2>
            <Link
              href={`/e/${activeEvent.slug}`}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950"
            >
              Enviar mi lista
            </Link>
          </section>
        ) : (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center">
            <p className="text-zinc-300">No hay torneo abierto en este momento.</p>
            <p className="mt-2 text-sm text-zinc-500">
              La tienda puede crear uno desde el panel de administración.
            </p>
          </section>
        )}

        <section className="space-y-3 text-sm text-zinc-400">
          <h3 className="font-semibold text-zinc-200">Para jugadores</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Pega tu lista desde Pokémon TCG Live (formato en inglés)</li>
            <li>Validación en vivo de 60 cartas</li>
            <li>Edita hasta la hora límite con tu enlace personal</li>
          </ul>
        </section>

        <Link
          href="/admin/login"
          className="text-center text-sm text-zinc-500 underline hover:text-zinc-300"
        >
          Acceso tienda / administración
        </Link>
      </main>
    </div>
  );
}
