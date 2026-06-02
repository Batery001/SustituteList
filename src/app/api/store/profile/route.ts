import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/event-utils";
import { msg } from "@/lib/messages";
import { Store } from "@/models/Store";

export async function GET() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  await connectDB();
  const store = await Store.findById(storeId).lean();
  if (!store) {
    return NextResponse.json({ error: msg.api.storeNotFound }, { status: 404 });
  }

  return NextResponse.json({
    store: {
      name: store.name,
      slug: store.slug,
      email: store.email,
      timezone: store.timezone,
      address: store.address ?? "",
      city: store.city ?? "",
      phone: store.phone ?? "",
      description: store.description ?? "",
      defaultEntryFeeCents: store.defaultEntryFeeCents ?? 0,
      onlinePaymentsEnabled: store.onlinePaymentsEnabled !== false,
      transbankCommerceCode: store.transbankCommerceCode ?? "",
      transbankEnvironment:
        store.transbankEnvironment === "production"
          ? "production"
          : "integration",
      hasTransbankApiKey: Boolean(store.transbankApiKey?.trim()),
    },
  });
}

export async function PUT(request: Request) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: msg.api.unauthorized }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      slug?: string;
      timezone?: string;
      address?: string;
      city?: string;
      phone?: string;
      description?: string;
      defaultEntryFeeCents?: number;
      transbankCommerceCode?: string;
      transbankApiKey?: string;
      transbankEnvironment?: "integration" | "production";
      onlinePaymentsEnabled?: boolean;
    };

    await connectDB();
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ error: msg.api.storeNotFound }, { status: 404 });
    }

    if (body.name?.trim()) store.name = body.name.trim();
    if (body.timezone?.trim()) store.timezone = body.timezone.trim();
    if (body.address !== undefined) store.address = body.address.trim();
    if (body.city !== undefined) store.city = body.city.trim();
    if (body.phone !== undefined) store.phone = body.phone.trim();
    if (body.description !== undefined) store.description = body.description.trim();
    if (typeof body.defaultEntryFeeCents === "number") {
      store.defaultEntryFeeCents = Math.max(0, Math.round(body.defaultEntryFeeCents));
    }
    if (body.transbankCommerceCode !== undefined) {
      store.transbankCommerceCode = body.transbankCommerceCode.trim();
    }
    if (body.transbankApiKey?.trim()) {
      store.transbankApiKey = body.transbankApiKey.trim();
    }
    if (
      body.transbankEnvironment === "production" ||
      body.transbankEnvironment === "integration"
    ) {
      store.transbankEnvironment = body.transbankEnvironment;
    }
    if (typeof body.onlinePaymentsEnabled === "boolean") {
      store.onlinePaymentsEnabled = body.onlinePaymentsEnabled;
    }

    if (body.slug?.trim()) {
      const slug = slugify(body.slug);
      const taken = await Store.findOne({ slug, _id: { $ne: storeId } });
      if (taken) {
        return NextResponse.json({ error: msg.api.storeSlugTaken }, { status: 409 });
      }
      store.slug = slug;
    }

    await store.save();

    return NextResponse.json({
      store: {
        name: store.name,
        slug: store.slug,
        timezone: store.timezone,
        address: store.address,
        city: store.city,
        phone: store.phone,
        description: store.description,
        defaultEntryFeeCents: store.defaultEntryFeeCents,
        transbankEnvironment: store.transbankEnvironment,
      },
    });
  } catch (err) {
    console.error("Store profile update:", err);
    return NextResponse.json({ error: msg.api.profileUpdateFailed }, { status: 500 });
  }
}
