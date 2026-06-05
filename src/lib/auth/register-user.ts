import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/dbConnect";
import { getStoreTimezone, slugify } from "@/lib/event-utils";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";
import { User } from "@/models/User";
import type { UserRole } from "@/types/models";

export type RegisterPlayerInput = {
  role: "PLAYER";
  name: string;
  email: string;
  password: string;
  popId: string;
  birthDate: string;
};

export type RegisterStoreInput = {
  role: "STORE";
  name: string;
  email: string;
  password: string;
  city: string;
  country: string;
};

export type RegisterInput = RegisterPlayerInput | RegisterStoreInput;

export class RegisterError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "RegisterError";
  }
}

async function uniqueStoreSlug(base: string): Promise<string> {
  let slug = slugify(base);
  if (!slug) slug = `tienda-${Date.now().toString(36)}`;
  if (!(await Store.findOne({ slug }))) return slug;
  return `${slug}-${Date.now().toString(36)}`;
}

export async function registerUser(input: RegisterInput) {
  if (input.password.length < 6) {
    throw new RegisterError("La contraseña debe tener al menos 6 caracteres", 400);
  }

  await dbConnect();

  const email = input.email.toLowerCase().trim();
  if (await User.findOne({ email })) {
    throw new RegisterError("Ya existe una cuenta con este correo", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  if (input.role === "PLAYER") {
    const popId = input.popId.trim();
    const birth = new Date(input.birthDate);
    if (Number.isNaN(birth.getTime())) {
      throw new RegisterError("Fecha de nacimiento no válida", 400);
    }

    if (await User.findOne({ popId })) {
      throw new RegisterError("Ya existe una cuenta con este Pop ID", 409);
    }
    if (await Player.findOne({ email })) {
      throw new RegisterError("Ya existe una cuenta con este correo", 409);
    }
    if (await Player.findOne({ popId })) {
      throw new RegisterError("Ya existe una cuenta con este Pop ID", 409);
    }

    const user = await User.create({
      name: input.name.trim(),
      email,
      passwordHash,
      popId,
      birthDate: birth,
      role: "PLAYER" satisfies UserRole,
    });

    await Player.create({
      email,
      passwordHash,
      playerName: input.name.trim(),
      popId,
      birthDate: birth,
    });

    return {
      userId: user._id.toString(),
      role: "PLAYER" as const,
      redirect: "/dashboard/player",
    };
  }

  if (await Store.findOne({ email })) {
    throw new RegisterError("Ya existe una tienda con este correo", 409);
  }

  const slug = await uniqueStoreSlug(input.name);
  const user = await User.create({
    name: input.name.trim(),
    email,
    passwordHash,
    role: "STORE" satisfies UserRole,
  });

  const store = await Store.create({
    name: input.name.trim(),
    email,
    passwordHash,
    slug,
    city: input.city.trim(),
    country: input.country.trim() || "Chile",
    userId: user._id,
    timezone: getStoreTimezone(),
  });

  return {
    userId: user._id.toString(),
    storeId: store._id.toString(),
    role: "STORE" as const,
    redirect: "/dashboard/store",
  };
}
