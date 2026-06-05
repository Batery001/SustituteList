import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Event } from "@/models/Event";
import { Store } from "@/models/Store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ storeSlug: string }> }
) {
  const { storeSlug } = await params;
  await connectDB();

  const store = await Store.findOne({ slug: storeSlug }).lean();
  if (!store) {
    return NextResponse.json({ error: "Tienda no encontrada" }, { status: 404 });
  }

  const events = await Event.find({ storeId: store._id, status: "open" })
    .sort({ startsAt: 1 })
    .lean();

  return NextResponse.json({
    store: {
      name: store.name,
      slug: store.slug,
      city: store.city,
      address: store.address,
      phone: store.phone,
      description: store.description,
    },
    events: events.map((e) => ({
      name: e.name,
      slug: e.slug,
      type: e.type,
      startsAt: e.startsAt,
      decklistDeadlineAt: e.decklistDeadlineAt,
      entryFeeCents: e.entryFeeCents ?? store.defaultEntryFeeCents ?? 0,
    })),
  });
}
