import Link from "next/link";
import { BrandHeader } from "@/components/BrandHeader";
import { Logo } from "@/components/Logo";
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
    <div className="mx-auto flex min-h-full max-w-lg flex-col">
      <BrandHeader />
      <main className="flex flex-1 flex-col gap-6 px-4 py-8">
        {activeEvent ? (
          <section className="sub-panel relative overflow-hidden rounded-2xl p-6">
            <div
              className="pointer-events-none absolute -right-2 top-2 h-24 w-24 opacity-20"
              aria-hidden
            >
              <Logo size="lg" showName={false} href={null} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-400">
              Torneo activo
            </p>
            <h2 className="mt-1 text-xl font-bold text-sky-50">
              {activeEvent.name}
            </h2>
            <Link
              href={`/e/${activeEvent.slug}`}
              className="sub-btn-primary mt-4 inline-flex w-full items-center justify-center rounded-xl py-3 text-sm"
            >
              Enviar mi lista
            </Link>
          </section>
        ) : (
          <section className="sub-panel rounded-2xl p-6 text-center">
            <p className="text-sky-100/80">No hay torneo abierto en este momento.</p>
            <p className="mt-2 text-sm text-sky-100/45">
              La tienda puede crear uno desde el panel de administración.
            </p>
          </section>
        )}

        <section className="space-y-3 text-sm text-sky-100/50">
          <h3 className="font-semibold text-sky-100/90">Para jugadores</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Pega tu lista desde Pokémon TCG Live (formato en inglés)</li>
            <li>Validación en vivo de 60 cartas</li>
            <li>Edita hasta la hora límite con tu enlace personal</li>
          </ul>
        </section>

        <Link href="/admin/login" className="sub-link text-center text-sm">
          Acceso tienda / administración
        </Link>
      </main>
    </div>
  );
}
