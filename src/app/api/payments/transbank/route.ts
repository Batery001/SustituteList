import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { msg } from "@/lib/messages";
import { getPublicBaseUrl } from "@/lib/app-url";
import {
  buildBuyOrder,
  createWebpayTransaction,
  getTransbankCredentials,
  isTransbankConfigured,
} from "@/lib/transbank";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { registrationAccessToken } = (await request.json()) as {
      registrationAccessToken?: string;
    };

    if (!registrationAccessToken) {
      return NextResponse.json({ error: msg.api.allFieldsRequired }, { status: 400 });
    }

    await connectDB();

    const registration = await Registration.findOne({
      accessToken: registrationAccessToken,
    });
    if (!registration) {
      return NextResponse.json(
        { error: msg.api.registrationNotFound },
        { status: 404 }
      );
    }

    if (registration.paymentStatus === "paid") {
      return NextResponse.json({ error: "Ya está pagado", alreadyPaid: true });
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return NextResponse.json({ error: msg.api.eventNotFound }, { status: 404 });
    }

    const store = await Store.findById(event.storeId);
    if (!store) {
      return NextResponse.json({ error: msg.api.storeNotFound }, { status: 404 });
    }

    if (store.onlinePaymentsEnabled === false) {
      return NextResponse.json(
        { error: msg.api.onlinePaymentsDisabled },
        { status: 403 }
      );
    }

    const amount = event.entryFeeCents ?? store.defaultEntryFeeCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Este torneo no tiene cuota de pago" },
        { status: 400 }
      );
    }

    const creds = getTransbankCredentials(store);
    if (!isTransbankConfigured(store)) {
      return NextResponse.json(
        { error: msg.api.transbankNotConfigured },
        { status: 503 }
      );
    }

    const baseUrl = getPublicBaseUrl(request);
    const returnUrl = `${baseUrl}/api/payments/transbank/return?access=${registration.accessToken}`;

    const buyOrder = buildBuyOrder(registration._id.toString());

    const tx = await createWebpayTransaction(creds!, {
      buyOrder,
      sessionId: registration.accessToken,
      amount,
      returnUrl,
    });

    registration.tbkBuyOrder = buyOrder;
    registration.tbkToken = tx.token;
    await registration.save();

    return NextResponse.json({
      url: tx.url,
      token: tx.token,
    });
  } catch (err) {
    console.error("Transbank create error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : msg.api.paymentCreateFailed,
      },
      { status: 500 }
    );
  }
}
