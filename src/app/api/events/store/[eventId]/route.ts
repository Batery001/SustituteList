import { NextResponse } from "next/server";
import { getAdminStoreId } from "@/lib/auth";
import { getStoreEventForStore } from "@/lib/events/get-store-events";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const storeId = await getAdminStoreId();
  if (!storeId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { eventId } = await params;

  try {
    const event = await getStoreEventForStore(storeId, eventId);
    if (!event) {
      return NextResponse.json({ error: "Torneo no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ event });
  } catch (err) {
    console.error("Store event detail error:", err);
    return NextResponse.json(
      { error: "No se pudo cargar el torneo" },
      { status: 500 }
    );
  }
}
