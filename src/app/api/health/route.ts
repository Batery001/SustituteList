import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { formatNowInTimeZone, getStoreTimezone } from "@/lib/event-utils";

export const runtime = "nodejs";

/** Diagnóstico rápido (no expone secretos). */
export async function GET() {
  const storeTimezone = getStoreTimezone();
  const checks = {
    MONGODB_URI: Boolean(process.env.MONGODB_URI),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    ADMIN_EMAIL: Boolean(process.env.ADMIN_EMAIL),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
    STORE_NAME: Boolean(process.env.STORE_NAME),
    STORE_TIMEZONE: Boolean(process.env.STORE_TIMEZONE),
    storeTimezone,
    serverNowInStoreTz: formatNowInTimeZone(storeTimezone),
    adminEmailHint: process.env.ADMIN_EMAIL?.toLowerCase().trim() ?? null,
    database: "unknown" as "ok" | "error" | "unknown",
    databaseError: null as string | null,
  };

  if (checks.MONGODB_URI) {
    try {
      await connectDB();
      checks.database = "ok";
    } catch (err) {
      checks.database = "error";
      checks.databaseError =
        err instanceof Error ? err.message : "Connection failed";
    }
  } else {
    checks.database = "error";
    checks.databaseError = "MONGODB_URI not set";
  }

  const allEnvOk =
    checks.MONGODB_URI &&
    checks.SESSION_SECRET &&
    checks.ADMIN_EMAIL &&
    checks.ADMIN_PASSWORD;

  const ok = allEnvOk && checks.database === "ok";

  return NextResponse.json(
    { ok, checks },
    { status: ok ? 200 : 503 }
  );
}
