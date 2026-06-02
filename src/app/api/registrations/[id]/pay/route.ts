import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";

export async function POST(
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
      return NextResponse.json({ error: msg.api.registrationNotFound }, { status: 404 });
    }

    const event = await Event.findOne({
      _id: registration.eventId,
      storeId,
    });
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    registration.paymentStatus = "paid";
    registration.paidAt = new Date();
    await registration.save();

    return NextResponse.json({
      registration: {
        id: registration._id.toString(),
        paymentStatus: registration.paymentStatus,
        paidAt: registration.paidAt,
      },
    });
  } catch (err) {
    console.error("Mark paid error:", err);
    return NextResponse.json({ error: msg.api.markPaidFailed }, { status: 500 });
  }
}
