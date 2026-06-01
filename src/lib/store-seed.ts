import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getStoreTimezone } from "@/lib/event-utils";
import { Store } from "@/models/Store";

export async function ensureStore(): Promise<string> {
  await connectDB();

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.STORE_NAME ?? "Substitute List League";
  const timezone = getStoreTimezone();

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  let store = await Store.findOne({ email });

  if (!store) {
    const passwordHash = await bcrypt.hash(password, 12);
    store = await Store.create({ email, passwordHash, name, timezone });
    return store._id.toString();
  }

  // Si cambiaste ADMIN_PASSWORD en Vercel, actualiza el hash en la BD
  const passwordMatches = await bcrypt.compare(password, store.passwordHash);
  if (!passwordMatches) {
    store.passwordHash = await bcrypt.hash(password, 12);
  }

  if (store.name !== name) store.name = name;
  if (store.timezone !== timezone) store.timezone = timezone;

  if (store.isModified()) {
    await store.save();
  }

  return store._id.toString();
}
