import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import {
  createMercadoPagoPreference,
  getMercadoPagoToken,
  getPublicBaseUrl,
  isMercadoPagoConfigured,
} from "@/lib/mercadopago";
import { msg } from "@/lib/messages";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";
import { Player } from "@/models/Player";

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

    const amount =
      event.entryFeeCents ?? store.defaultEntryFeeCents ?? 0;
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Este torneo no tiene cuota de pago" },
        { status: 400 }
      );
    }

    const mpToken = getMercadoPagoToken(store.mercadoPagoAccessToken);
    if (!isMercadoPagoConfigured(mpToken)) {
      return NextResponse.json(
        { error: msg.api.mercadoPagoNotConfigured },
        { status: 503 }
      );
    }

    const baseUrl = getPublicBaseUrl(request);
    const returnPath = `/e/${event.slug}/mi-inscripcion/${registration.accessToken}`;
    const backUrls = {
      success: `${baseUrl}${returnPath}?payment=success`,
      failure: `${baseUrl}${returnPath}?payment=failure`,
      pending: `${baseUrl}${returnPath}?payment=pending`,
    };

    let payerEmail: string | undefined;
    if (registration.playerId) {
      const player = await Player.findById(registration.playerId).lean();
      payerEmail = player?.email;
    }

    const preference = await createMercadoPagoPreference({
      accessToken: mpToken!,
      items: [
        {
          title: `Inscripción: ${event.name}`,
          quantity: 1,
          unit_price: amount,
          currency_id: "CLP",
        },
      ],
      externalReference: registration._id.toString(),
      notificationUrl: `${baseUrl}/api/payments/webhook/mercadopago`,
      backUrls,
      payerEmail,
    });

    registration.mpPreferenceId = preference.id;
    await registration.save();

    const useSandbox =
      process.env.MERCADOPAGO_SANDBOX === "true" && preference.sandboxInitPoint;

    return NextResponse.json({
      initPoint: useSandbox ? preference.sandboxInitPoint : preference.initPoint,
      preferenceId: preference.id,
    });
  } catch (err) {
    console.error("Mercado Pago checkout error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : msg.api.paymentCreateFailed,
      },
      { status: 500 }
    );
  }
}
