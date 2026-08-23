import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  indexesEnsured?: boolean;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

async function ensureIndexesOnce() {
  if (cached.indexesEnsured) return;
  try {
    const { ensureRegistrationIndexes } = await import(
      "@/lib/db/ensure-registration-indexes"
    );
    await ensureRegistrationIndexes();
    cached.indexesEnsured = true;
  } catch (err) {
    console.error("ensureRegistrationIndexes failed:", err);
  }
}

/**
 * Conexión singleton a MongoDB.
 * Reutiliza la misma conexión en hot-reload de Next.js (desarrollo).
 */
export async function dbConnect(): Promise<typeof mongoose> {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI no está definida. Agrégala en .env.local (ver .env.example)."
    );
  }

  if (cached.conn) {
    await ensureIndexesOnce();
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      autoIndex: false,
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });
  }

  try {
    cached.conn = await cached.promise;
    await ensureIndexesOnce();
  } catch (err) {
    cached.promise = null;
    cached.conn = null;
    cached.indexesEnsured = false;
    throw err;
  }

  return cached.conn;
}

export default dbConnect;
