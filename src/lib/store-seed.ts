import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { Store } from "@/models/Store";

export async function ensureStore(): Promise<string> {
  await connectDB();

  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.STORE_NAME ?? "Substitute List League";
  const timezone = process.env.STORE_TIMEZONE ?? "America/Mexico_City";

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  let store = await Store.findOne({ email });

  if (!store) {
    const passwordHash = await bcrypt.hash(password, 12);
    store = await Store.create({ email, passwordHash, name, timezone });
  }

  return store._id.toString();
}
