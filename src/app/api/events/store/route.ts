import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { getStoreEventsSummary } from "@/lib/events/get-store-events";

export const runtime = "nodejs";

export async function GET() {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const events = await getStoreEventsSummary(storeId);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Store events error:", err);
    return NextResponse.json(
      { error: "No se pudieron cargar los torneos" },
      { status: 500 }
    );
  }
}
