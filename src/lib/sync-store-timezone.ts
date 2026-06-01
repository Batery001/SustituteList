import { getStoreTimezone } from "@/lib/event-utils";
import { Store } from "@/models/Store";

/** Alinea la zona en MongoDB con STORE_TIMEZONE de Vercel. */
export async function syncStoreTimezone(storeId: string): Promise<string> {
  const tz = getStoreTimezone();
  await Store.updateOne({ _id: storeId }, { $set: { timezone: tz } });
  return tz;
}
