import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { getAppUrl } from "@/lib/app-url";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { connectDB } from "@/lib/db";
import {
  decklistPdfFilename,
  generateDecklistPdfBuffer,
} from "@/lib/decklist-pdf";
import { formatDivision } from "@/lib/division";
import { msg } from "@/lib/messages";
import { zipStoreFiles } from "@/lib/zip-store";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Player } from "@/models/Player";
import { Registration } from "@/models/Registration";

export const runtime = "nodejs";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { eventId } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";

  try {
    await connectDB();
    const event = await Event.findOne({ _id: eventId, storeId });
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    const registrations = await Registration.find({ eventId: event._id })
      .sort({ division: 1, playerName: 1 })
      .lean();

    const playerIds = registrations
      .map((r) => r.playerId)
      .filter((id): id is NonNullable<typeof id> => id != null);
    const players =
      playerIds.length > 0
        ? await Player.find({ _id: { $in: playerIds } })
            .select("email")
            .lean()
        : [];
    const emailByPlayer = new Map(
      players.map((p) => [p._id.toString(), p.email])
    );

    const submissions = await DecklistSubmission.find({
      eventId: event._id,
    }).lean();
    const subById = new Map(submissions.map((s) => [s._id.toString(), s]));
    const app = getAppUrl();

    if (format === "csv") {
      const header = [
        "Nombre",
        "Pop ID",
        "Division",
        "Email",
        "Pago",
        "Lista",
        "Link",
      ];
      const rows = registrations.map((r) => {
        const sub = r.decklistSubmissionId
          ? subById.get(r.decklistSubmissionId.toString())
          : null;
        const email =
          r.email ||
          (r.playerId ? emailByPlayer.get(r.playerId.toString()) : "") ||
          "";
        return [
          r.playerName,
          r.popId,
          formatDivision(r.division as "master"),
          email,
          r.paymentStatus === "paid" ? "pagado" : "pendiente",
          sub ? "si" : "no",
          `${app}/e/${event.slug}/mi-inscripcion/${r.accessToken}`,
        ]
          .map((v) => csvEscape(String(v)))
          .join(",");
      });
      const csv = [header.join(","), ...rows].join("\n");
      const filename = `inscritos_${event.slug}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    if (format === "pdfs") {
      const files: { name: string; data: Uint8Array }[] = [];
      for (const sub of submissions) {
        const parsed = await parseAndEnrichPokemonDecklist(sub.rawText ?? "");
        const pdfData = {
          eventName: event.name,
          playerName: sub.playerName,
          popId: sub.popId,
          division: sub.division,
          cards: (sub.parsedCards ?? []).map((c) => ({
            qty: c.qty ?? 0,
            name: c.name ?? "",
            setCode: c.setCode ?? undefined,
            number: c.number ?? undefined,
            category: c.category ?? undefined,
          })),
          rawText: sub.rawText,
          categories: parsed.categories,
          cardCount: sub.validation?.cardCount ?? 0,
          updatedAt: sub.updatedAt,
        };
        const buffer = generateDecklistPdfBuffer(pdfData);
        files.push({
          name: decklistPdfFilename(pdfData),
          data: new Uint8Array(buffer),
        });
      }
      if (files.length === 0) {
        return NextResponse.json(
          { error: "Aún no hay listas para descargar" },
          { status: 404 }
        );
      }
      const zip = zipStoreFiles(files);
      return new NextResponse(Buffer.from(zip), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="listas_${event.slug}.zip"`,
        },
      });
    }

    return NextResponse.json({ error: "Formato no válido" }, { status: 400 });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: msg.api.exportFailed }, { status: 500 });
  }
}
