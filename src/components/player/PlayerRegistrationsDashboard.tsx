"use client";

import Link from "next/link";
import type { PlayerRegistrationRow } from "@/lib/player/get-player-registrations";
import { DownloadDeckPdfButton } from "@/components/deck/DownloadDeckPdfButton";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function RegistrationCard({ reg }: { reg: PlayerRegistrationRow }) {
  const deckAction = reg.canUploadDeck ? (
    reg.hasDecklist ? (
      <Link
        href={`/dashboard/player/upload/${reg.id}`}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-300"
      >
        ✅ Modificar Decklist
      </Link>
    ) : (
      <Link
        href={`/dashboard/player/upload/${reg.id}`}
        className="inline-flex items-center gap-1 rounded-lg bg-amber-500/20 px-3 py-2 text-sm font-semibold text-amber-200"
      >
        ⚠️ Subir Decklist
      </Link>
    )
  ) : reg.hasDecklist ? (
    <span className="text-xs text-emerald-400">✅ Lista enviada</span>
  ) : reg.paymentStatus !== "paid" ? (
    <span className="text-xs text-amber-400">Pago pendiente</span>
  ) : reg.deadlinePassed ? (
    <span className="text-xs text-sky-100/45">Plazo de lista cerrado</span>
  ) : null;

  return (
    <li className="sub-panel rounded-xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/e/${reg.eventSlug}`}
            className="font-semibold text-sky-50 hover:text-sky-300"
          >
            {reg.eventName}
          </Link>
          <p className="mt-1 text-sm text-sky-200/75">
            {formatDate(reg.startsAt)}
          </p>
          <p className="mt-1 text-xs text-sky-100/45">
            Lista hasta: {formatDate(reg.decklistDeadlineAt)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`rounded-md px-2 py-0.5 text-xs font-medium ${
              reg.paymentStatus === "paid"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {reg.paymentStatus === "paid" ? "Pagado" : "Pago pendiente"}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {deckAction}
            {reg.hasDecklist && reg.deckEditToken && (
              <DownloadDeckPdfButton
                token={reg.deckEditToken}
                label="PDF"
                className="px-2 py-1.5 text-xs"
              />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function RegistrationSection({
  title,
  empty,
  items,
}: {
  title: string;
  empty: string;
  items: PlayerRegistrationRow[];
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold text-sky-100/90">{title}</h2>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-sky-500/20 p-5 text-center text-sm text-sky-100/50">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((reg) => (
            <RegistrationCard key={reg.id} reg={reg} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function PlayerRegistrationsDashboard({
  playerName,
  popId,
  active,
  history,
}: {
  playerName: string;
  popId?: string | null;
  active: PlayerRegistrationRow[];
  history: PlayerRegistrationRow[];
}) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold text-sky-50">Panel de jugador</h1>
        <p className="mt-1 text-sm text-sky-100/55">
          Hola, <strong className="text-sky-200">{playerName}</strong>
          {popId ? <> · Pop ID {popId}</> : null}.
        </p>
      </div>

      <RegistrationSection
        title="Mis torneos activos"
        empty="No tienes inscripciones en torneos activos. Explora el hub para inscribirte."
        items={active}
      />

      <RegistrationSection
        title="Historial"
        empty="Aún no tienes torneos en tu historial."
        items={history}
      />
    </div>
  );
}
