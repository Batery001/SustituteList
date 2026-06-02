import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getMercadoPagoPayment, getMercadoPagoToken } from "@/lib/mercadopago";
import { markRegistrationPaid } from "@/lib/mark-registration-paid";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

async function resolveAccessToken(
  registrationId: string
): Promise<string | null> {
  const registration = await Registration.findById(registrationId);
  if (!registration) return getMercadoPagoToken();

  const event = await Event.findById(registration.eventId);
  if (!event) return getMercadoPagoToken();

  const store = await Store.findById(event.storeId);
  return getMercadoPagoToken(store?.mercadoPagoAccessToken);
}

async function processPaymentId(paymentId: string): Promise<void> {
  await connectDB();

  const globalToken = getMercadoPagoToken();
  if (!globalToken) {
    console.warn("MP webhook: no access token configured");
    return;
  }

  let payment: Awaited<ReturnType<typeof getMercadoPagoPayment>>;
  try {
    payment = await getMercadoPagoPayment(globalToken, paymentId);
  } catch {
    return;
  }

  if (!payment.external_reference) return;

  const storeToken = await resolveAccessToken(payment.external_reference);
  if (storeToken && storeToken !== globalToken) {
    try {
      payment = await getMercadoPagoPayment(storeToken, paymentId);
    } catch {
      return;
    }
  }

  if (payment.status !== "approved" || !payment.external_reference) return;

  await markRegistrationPaid(payment.external_reference, {
    mpPaymentId: String(payment.id),
  });
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
    let paymentId: string | null =
      url.searchParams.get("id") ?? url.searchParams.get("data.id");

    if (!paymentId) {
      const body = (await request.json().catch(() => ({}))) as {
        type?: string;
        action?: string;
        data?: { id?: string };
      };
      if (body.type === "payment" || body.action?.includes("payment")) {
        paymentId = body.data?.id ?? null;
      }
    }

    if (paymentId && (topic === "payment" || topic === undefined || !topic)) {
      await processPaymentId(paymentId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("MP webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get("topic");
  const id = url.searchParams.get("id");
  if (topic === "payment" && id) {
    await processPaymentId(id);
  }
  return NextResponse.json({ ok: true });
}
