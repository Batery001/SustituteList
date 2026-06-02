import Link from "next/link";
import { PageShell } from "@/components/PageShell";
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
    <PageShell area="public">
      <div className="flex flex-col gap-6">
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
              Inscribirme al torneo
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

        <section className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="sub-btn-primary rounded-xl px-6 py-3 text-center text-sm"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/jugador/registro"
            className="rounded-xl border border-sky-500/30 px-6 py-3 text-center text-sm text-sky-200"
          >
            Crear cuenta de jugador
          </Link>
        </section>

        <section className="space-y-3 text-sm text-sky-100/50">
          <h3 className="font-semibold text-sky-100/90">Cómo funciona</h3>
          <ul className="list-inside list-disc space-y-1">
            <li>Inscríbete → paga → registra tu lista (60 cartas, inglés)</li>
            <li>El mismo login sirve para tienda (panel) y jugadores (cuenta)</li>
          </ul>
        </section>
      </div>
    </PageShell>
  );
}
