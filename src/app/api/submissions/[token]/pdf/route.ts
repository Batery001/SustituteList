import { NextResponse } from "next/server";
import { parseAndEnrichPokemonDecklist } from "@/lib/card-lookup/enrich-categories";
import { getDecklistAccess } from "@/lib/auth/decklist-access";
import { toStoredParsedCards } from "@/lib/deckParser";
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
  request: Request,
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

    const access = await getDecklistAccess(submission, event);
    if (!access) {
      return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
    }

    // Siempre regenerar desde rawText actual (no confiar en cards viejas en caché de DB/cliente).
    const parsed = await parseAndEnrichPokemonDecklist(submission.rawText ?? "");
    const cards = toStoredParsedCards(parsed.cards);

    const updatedAt = submission.updatedAt
      ? new Date(submission.updatedAt)
      : new Date();
    const etag = `"deck-${submission._id.toString()}-${updatedAt.getTime()}"`;

    if (request.headers.get("if-none-match") === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        },
      });
    }

    const pdfData = {
      eventName: event.name,
      playerName: submission.playerName,
      popId: submission.popId,
      division: submission.division,
      cards,
      rawText: submission.rawText,
      categories: parsed.categories,
      cardCount: parsed.cardCount,
      updatedAt,
    };

    const buffer = generateDecklistPdfBuffer(pdfData);
    const filename = decklistPdfFilename(pdfData);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "private, no-store, max-age=0, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ETag: etag,
        "Last-Modified": updatedAt.toUTCString(),
      },
    });
  } catch (err) {
    console.error("Generate deck PDF error:", err);
    return NextResponse.json({ error: msg.api.serverError }, { status: 500 });
  }
}
