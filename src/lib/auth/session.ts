import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { dbConnect } from "@/lib/dbConnect";
import { Store } from "@/models/Store";

const COOKIE_NAME = "substitute_admin_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not defined");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createSessionToken(storeId: string): string {
  const exp = Date.now() + MAX_AGE * 1000;
  const nonce = randomBytes(8).toString("hex");
  const payload = `${storeId}.${exp}.${nonce}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(
  token: string | undefined
): { storeId: string } | null {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 4) return null;

  const [storeId, expStr, nonce, sig] = parts;
  const payload = `${storeId}.${expStr}.${nonce}`;
  const expected = sign(payload);

  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  const exp = parseInt(expStr, 10);
  if (Number.isNaN(exp) || Date.now() > exp) return null;

  return { storeId };
}

export async function getAdminStoreId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const legacy = verifySessionToken(token);
  if (legacy?.storeId) {
    return legacy.storeId;
  }

  const session = await auth();
  if (
    session?.user?.role !== "STORE" &&
    session?.user?.role !== "ADMIN"
  ) {
    return null;
  }
  if (!session.user.email) {
    return null;
  }

  await dbConnect();
  const store = await Store.findOne({
    email: session.user.email.toLowerCase(),
  })
    .select("_id")
    .lean();

  return store?._id.toString() ?? null;
}

export { COOKIE_NAME, MAX_AGE };
