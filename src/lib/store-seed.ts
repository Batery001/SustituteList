import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { getStoreTimezone, slugify } from "@/lib/event-utils";
import { applyTransbankEnvToStore } from "@/lib/sync-transbank-env";
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
    let slug = slugify(name);
    const taken = await Store.findOne({ slug });
    if (taken) slug = `${slug}-${Date.now().toString(36)}`;
    store = await Store.create({ email, passwordHash, name, timezone, slug });
    applyTransbankEnvToStore(store);
    if (store.isModified()) await store.save();
    return store._id.toString();
  }

  if (!store.slug) {
    let slug = slugify(store.name);
    const taken = await Store.findOne({ slug, _id: { $ne: store._id } });
    if (taken) slug = `${slug}-${store._id.toString().slice(-6)}`;
    store.slug = slug;
  }

  // Si cambiaste ADMIN_PASSWORD en Vercel, actualiza el hash en la BD
  const passwordMatches = await bcrypt.compare(password, store.passwordHash);
  if (!passwordMatches) {
    store.passwordHash = await bcrypt.hash(password, 12);
  }

  if (store.name !== name) store.name = name;
  if (store.timezone !== timezone) store.timezone = timezone;

  applyTransbankEnvToStore(store);

  if (store.isModified()) {
    await store.save();
  }

  return store._id.toString();
}
