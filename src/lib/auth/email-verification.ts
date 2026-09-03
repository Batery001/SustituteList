import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getAppUrl } from "@/lib/app-url";
import { dbConnect } from "@/lib/dbConnect";
import { isEmailConfigured, sendEmailVerificationEmail } from "@/lib/email";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";
import { User } from "@/models/User";

const VERIFY_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const RESEND_COOLDOWN_MS = 24 * 60 * 60 * 1000;

function getSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ?? process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET o SESSION_SECRET debe estar definido");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function createEmailVerifyToken(email: string): string {
  const exp = Date.now() + VERIFY_MAX_AGE_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = Buffer.from(
    JSON.stringify({
      email: email.toLowerCase(),
      exp,
      nonce,
      purpose: "verify",
    }),
    "utf8"
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyEmailVerifyToken(
  token: string | undefined
): { email: string } | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as {
      email?: string;
      exp?: number;
      purpose?: string;
    };
    if (
      parsed.purpose !== "verify" ||
      !parsed.email ||
      typeof parsed.exp !== "number" ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
    return { email: parsed.email.toLowerCase() };
  } catch {
    return null;
  }
}

export async function isEmailVerified(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return false;
  await dbConnect();
  const [user, player, store] = await Promise.all([
    User.findOne({ email: normalized }).select("emailVerifiedAt").lean(),
    Player.findOne({ email: normalized }).select("emailVerifiedAt").lean(),
    Store.findOne({ email: normalized }).select("emailVerifiedAt").lean(),
  ]);
  return Boolean(
    user?.emailVerifiedAt || player?.emailVerifiedAt || store?.emailVerifiedAt
  );
}

export async function markEmailVerified(email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  await dbConnect();
  const now = new Date();
  const [u, p, s] = await Promise.all([
    User.updateMany({ email: normalized }, { $set: { emailVerifiedAt: now } }),
    Player.updateMany(
      { email: normalized },
      { $set: { emailVerifiedAt: now } }
    ),
    Store.updateMany({ email: normalized }, { $set: { emailVerifiedAt: now } }),
  ]);
  return (
    u.matchedCount + p.matchedCount + s.matchedCount > 0
  );
}

async function accountName(email: string): Promise<string> {
  const [user, player, store] = await Promise.all([
    User.findOne({ email }).select("name").lean(),
    Player.findOne({ email }).select("playerName").lean(),
    Store.findOne({ email }).select("name").lean(),
  ]);
  return user?.name || player?.playerName || store?.name || "Hola";
}

async function lastSentAt(email: string): Promise<Date | null> {
  const [user, player, store] = await Promise.all([
    User.findOne({ email }).select("emailVerificationSentAt").lean(),
    Player.findOne({ email }).select("emailVerificationSentAt").lean(),
    Store.findOne({ email }).select("emailVerificationSentAt").lean(),
  ]);
  const dates = [
    user?.emailVerificationSentAt,
    player?.emailVerificationSentAt,
    store?.emailVerificationSentAt,
  ]
    .filter(Boolean)
    .map((d) => new Date(d as Date | string))
    .filter((d) => !Number.isNaN(d.getTime()));
  if (dates.length === 0) return null;
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

async function stampSent(email: string) {
  const now = new Date();
  await Promise.all([
    User.updateMany(
      { email },
      { $set: { emailVerificationSentAt: now } }
    ),
    Player.updateMany(
      { email },
      { $set: { emailVerificationSentAt: now } }
    ),
    Store.updateMany(
      { email },
      { $set: { emailVerificationSentAt: now } }
    ),
  ]);
}

export async function sendVerificationEmailTo(
  email: string,
  options?: { force?: boolean; name?: string }
): Promise<{
  ok: boolean;
  skipped?: boolean;
  alreadyVerified?: boolean;
  configured: boolean;
  error?: string;
}> {
  const normalized = email.toLowerCase().trim();
  const configured = isEmailConfigured();
  if (!normalized) return { ok: false, configured };

  await dbConnect();
  if (await isEmailVerified(normalized)) {
    return { ok: true, alreadyVerified: true, configured };
  }

  if (!configured) {
    return { ok: false, skipped: true, configured: false };
  }

  if (!options?.force) {
    const last = await lastSentAt(normalized);
    if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) {
      return { ok: true, skipped: true, configured };
    }
  }

  const token = createEmailVerifyToken(normalized);
  const verifyUrl = `${getAppUrl()}/auth/verificar?token=${encodeURIComponent(token)}`;
  const name = options?.name ?? (await accountName(normalized));
  const mailed = await sendEmailVerificationEmail({
    to: normalized,
    name,
    verifyUrl,
  });
  if (!mailed.ok && !mailed.skipped) {
    return { ok: false, configured, error: mailed.error };
  }
  if (mailed.ok) await stampSent(normalized);
  return {
    ok: mailed.ok,
    skipped: mailed.skipped,
    configured,
    error: mailed.error,
  };
}
