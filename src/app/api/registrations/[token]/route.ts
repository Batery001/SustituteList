import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { formatDeadline, getStoreTimezone } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { DecklistSubmission } from "@/models/DecklistSubmission";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";
import { isTransbankConfigured } from "@/lib/transbank";
import { markRegistrationPaid } from "@/lib/payments/mark-registration-paid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  await connectDB();

  const registration = await Registration.findOne({ accessToken: token }).lean();
  if (!registration) {
    return NextResponse.json({ error: msg.api.registrationNotFound }, { status: 404 });
  }

  const event = await Event.findById(registration.eventId).lean();
  if (!event) {
    return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
  }

  const store = await Store.findById(event.storeId).lean();
  const timezone = getStoreTimezone(store?.timezone);
  const deadlineLabel = formatDeadline(
    new Date(event.decklistDeadlineAt),
    timezone
  );

  let deckEditToken: string | null = null;
  if (registration.decklistSubmissionId) {
    const sub = await DecklistSubmission.findById(
      registration.decklistSubmissionId
    ).lean();
    deckEditToken = sub?.editToken ?? null;
  }

  const entryFeeCents =
    event.entryFeeCents ?? store?.defaultEntryFeeCents ?? 0;

  const onlinePaymentsAvailable =
    entryFeeCents > 0 &&
    store?.onlinePaymentsEnabled !== false &&
    isTransbankConfigured(store);

  return NextResponse.json({
    registration: {
      playerName: registration.playerName,
      popId: registration.popId,
      division: registration.division,
      paymentStatus: registration.paymentStatus,
      paidAt: registration.paidAt,
    },
    event: {
      name: event.name,
      slug: event.slug,
      status: event.status,
      decklistDeadlineAt: event.decklistDeadlineAt,
      deadlineLabel,
      entryFeeCents,
    },
    store: store
      ? {
          name: store.name,
          address: store.address,
          city: store.city,
          phone: store.phone,
        }
      : null,
    deckEditToken,
    onlinePaymentsAvailable,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let action = "confirm-attendance";
  try {
    const body = (await request.json()) as { action?: string };
    if (body.action) action = body.action;
  } catch {
    // sin cuerpo: confirmar asistencia
  }

  if (action !== "confirm-attendance") {
    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
  }

  try {
    await connectDB();
    const registration = await Registration.findOne({ accessToken: token });
    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
    }

    const ok = await markRegistrationPaid(registration._id.toString());
    if (!ok) {
      return NextResponse.json(
        { error: msg.api.markPaidFailed },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      paymentStatus: "paid",
    });
  } catch (err) {
    console.error("Confirm attendance error:", err);
    return NextResponse.json(
      { error: msg.api.markPaidFailed },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    await connectDB();
    const registration = await Registration.findOne({ accessToken: token });
    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
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
    console.error("Cancel attendance error:", err);
    return NextResponse.json(
      { error: msg.api.cancelRegistrationFailed },
      { status: 500 }
    );
  }
}
