import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  const { id } = await params;

  try {
    await connectDB();

    const registration = await Registration.findById(id);
    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
    }

    const event = await Event.findOne({
      _id: registration.eventId,
      storeId,
    });
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    if (registration.decklistSubmissionId) {
      await DecklistSubmission.deleteOne({
        _id: registration.decklistSubmissionId,
      });
    }
    await DecklistSubmission.deleteMany({
      eventId: registration.eventId,
      popId: registration.popId,
    });
    await Registration.deleteOne({ _id: registration._id });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Remove player error:", err);
    return NextResponse.json(
      { error: msg.api.removePlayerFailed },
      { status: 500 }
    );
  }
}
