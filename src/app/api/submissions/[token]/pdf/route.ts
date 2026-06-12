import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { connectDB } from "@/lib/db";
import {
  decklistPdfFilename,
  generateDecklistPdfBuffer,
} from "@/lib/decklist-pdf";
import { msg } from "@/lib/messages";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token?.trim()) {
      return NextResponse.json({ error: msg.api.decklistNotFound }, { status: 400 });
    }

    await connectDB();

    const submission = await DecklistSubmission.findOne({
      editToken: token.trim(),
    }).lean();

    if (!submission) {
      return NextResponse.json({ error: msg.api.decklistNotFound }, { status: 404 });
    }

    const event = await Event.findById(submission.eventId).lean();
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    const parsed = await parseAndEnrichPokemonDecklist(submission.rawText ?? "");

    const pdfData = {
      eventName: event.name,
      playerName: submission.playerName,
      popId: submission.popId,
      division: submission.division,
      cards: (submission.parsedCards ?? []).map((c) => ({
        qty: c.qty ?? 0,
        name: c.name ?? "",
        setCode: c.setCode ?? undefined,
        number: c.number ?? undefined,
        category: c.category ?? undefined,
      })),
      rawText: submission.rawText,
      categories: parsed.categories,
      cardCount: submission.validation?.cardCount ?? 0,
      updatedAt: submission.updatedAt,
    };

    const buffer = generateDecklistPdfBuffer(pdfData);
    const filename = decklistPdfFilename(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (err) {
    console.error("Generate deck PDF error:", err);
    return NextResponse.json({ error: msg.api.serverError }, { status: 500 });
  }
}
