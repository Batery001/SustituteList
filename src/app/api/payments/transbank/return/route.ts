import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { markRegistrationPaid } from "@/lib/mark-registration-paid";
import {
  commitWebpayTransaction,
  getTransbankCredentials,
} from "@/lib/transbank";
import { Event } from "@/models/Event";
import { Registration } from "@/models/Registration";
import { Store } from "@/models/Store";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("access");
  const tokenWs = url.searchParams.get("token_ws");
  const tbkToken = url.searchParams.get("TBK_TOKEN");

  if (!accessToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await connectDB();

  const registration = await Registration.findOne({ accessToken });
  if (!registration) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const event = await Event.findById(registration.eventId);
  const store = event ? await Store.findById(event.storeId) : null;
  const creds = getTransbankCredentials(store);
  const returnBase = event ? `/e/${event.slug}` : `/`;

  if (tbkToken || !tokenWs) {
    return NextResponse.redirect(
      new URL(`${returnBase}?payment=failure`, request.url)
    );
  }

  if (registration.paymentStatus === "paid") {
    return NextResponse.redirect(
      new URL(`${returnBase}?payment=success`, request.url)
    );
  }

  if (!creds) {
    return NextResponse.redirect(
      new URL(`${returnBase}?payment=error`, request.url)
    );
  }

  try {
    const result = await commitWebpayTransaction(creds, tokenWs);

    if (result.status === "AUTHORIZED") {
      await markRegistrationPaid(registration._id.toString(), {
        tbkAuthorizationCode: result.authorization_code,
      });
      return NextResponse.redirect(
        new URL(`${returnBase}?payment=success`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`${returnBase}?payment=failure`, request.url)
    );
  } catch (err) {
    console.error("Transbank commit error:", err);
    return NextResponse.redirect(
      new URL(`${returnBase}?payment=error`, request.url)
    );
  }
}

/** Transbank puede devolver POST en integración. */
export async function POST(request: Request) {
  const form = await request.formData();
  const tokenWs = form.get("token_ws")?.toString();
  const access = new URL(request.url).searchParams.get("access");

  if (!access) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const redirectUrl = new URL(
    `/api/payments/transbank/return?access=${encodeURIComponent(access)}`,
    request.url
  );
  if (tokenWs) redirectUrl.searchParams.set("token_ws", tokenWs);
  const tbk = form.get("TBK_TOKEN")?.toString();
  if (tbk) redirectUrl.searchParams.set("TBK_TOKEN", tbk);

  return NextResponse.redirect(redirectUrl);
}
