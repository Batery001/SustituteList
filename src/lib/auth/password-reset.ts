import bcrypt from "bcryptjs";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { dbConnect } from "@/lib/dbConnect";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";
import { User } from "@/models/User";

const RESET_MAX_AGE_MS = 30 * 60 * 1000;

function getSecret(): string {
  const secret =
    process.env.AUTH_SECRET?.trim() ?? process.env.SESSION_SECRET?.trim();
  if (!secret) throw new Error("AUTH_SECRET o SESSION_SECRET debe estar definido");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encodeTokenPayload(email: string, exp: number, nonce: string): string {
  return Buffer.from(
    JSON.stringify({ email: email.toLowerCase(), exp, nonce }),
    "utf8"
  ).toString("base64url");
}

function decodeTokenPayload(
  encoded: string
): { email: string; exp: number; nonce: string } | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as {
      email?: string;
      exp?: number;
      nonce?: string;
    };
    if (!parsed.email || typeof parsed.exp !== "number" || !parsed.nonce) {
      return null;
    }
    return { email: parsed.email, exp: parsed.exp, nonce: parsed.nonce };
  } catch {
    return null;
  }
}

function datesMatch(stored: Date, input: string): boolean {
  const s = new Date(stored);
  const i = new Date(`${input}T12:00:00`);
  return (
    s.getFullYear() === i.getFullYear() &&
    s.getMonth() === i.getMonth() &&
    s.getDate() === i.getDate()
  );
}

/** Token firmado: base64url(payload).hmac — soporta emails con puntos. */
export function createPasswordResetToken(email: string): string {
  const exp = Date.now() + RESET_MAX_AGE_MS;
  const nonce = randomBytes(8).toString("hex");
  const payload = encodeTokenPayload(email, exp, nonce);
  return `${payload}.${sign(payload)}`;
}

export function verifyPasswordResetToken(
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

  const data = decodeTokenPayload(payload);
  if (!data || Date.now() > data.exp) return null;

  return { email: data.email };
}

export class PasswordResetError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "PasswordResetError";
  }
}

export async function verifyPlayerRecovery(input: {
  email: string;
  popId: string;
  birthDate: string;
}): Promise<string> {
  const email = input.email.toLowerCase().trim();
  const popId = input.popId.trim();

  if (!email || !popId || !input.birthDate) {
    throw new PasswordResetError("Completa correo, Pop ID y fecha de nacimiento", 400);
  }

  await dbConnect();

  const user = await User.findOne({ email, role: "PLAYER" });
  if (user) {
    if (user.popId?.trim() !== popId) {
      throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
    }
    if (!user.birthDate || !datesMatch(user.birthDate, input.birthDate)) {
      throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
    }
    return createPasswordResetToken(email);
  }

  const player = await Player.findOne({ email });
  if (!player) {
    throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
  }

  if (player.popId.trim() !== popId) {
    throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
  }

  if (!datesMatch(player.birthDate, input.birthDate)) {
    throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
  }

  return createPasswordResetToken(email);
}

export async function verifyStoreRecovery(input: {
  email: string;
  storeName: string;
}): Promise<string> {
  const email = input.email.toLowerCase().trim();
  const storeName = input.storeName.trim();

  if (!email || !storeName) {
    throw new PasswordResetError("Completa correo y nombre de la tienda", 400);
  }

  await dbConnect();

  const user = await User.findOne({ email, role: "STORE" });
  if (user) {
    if (user.name.trim().toLowerCase() !== storeName.toLowerCase()) {
      throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
    }
    return createPasswordResetToken(email);
  }

  const store = await Store.findOne({ email });
  if (!store) {
    throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
  }

  if (store.name.trim().toLowerCase() !== storeName.toLowerCase()) {
    throw new PasswordResetError("Los datos no coinciden con ninguna cuenta", 401);
  }

  return createPasswordResetToken(email);
}

export async function applyPasswordReset(
  resetToken: string,
  password: string
): Promise<void> {
  if (password.length < 6) {
    throw new PasswordResetError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  const verified = verifyPasswordResetToken(resetToken);
  if (!verified) {
    throw new PasswordResetError(
      "La sesión de recuperación expiró o no es válida. Vuelve a verificar tus datos.",
      401
    );
  }

  await dbConnect();

  const passwordHash = await bcrypt.hash(password, 12);
  const email = verified.email;

  await User.updateOne({ email }, { $set: { passwordHash } });
  await Player.updateOne({ email }, { $set: { passwordHash } });
  await Store.updateOne({ email }, { $set: { passwordHash } });

  const updated =
    (await User.exists({ email })) ||
    (await Player.exists({ email })) ||
    (await Store.exists({ email }));

  if (!updated) {
    throw new PasswordResetError("No se encontró la cuenta", 404);
  }
}
