import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { dbConnect } from "@/lib/dbConnect";
import { Player } from "@/models/Player";
import { Store } from "@/models/Store";
import { User } from "@/models/User";
import type { UserRole } from "@/types/models";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString();

        if (!email || !password) return null;

        await dbConnect();

        const user = await User.findOne({ email }).select("+passwordHash");
        if (user?.passwordHash) {
          const valid = await bcrypt.compare(password, user.passwordHash);
          if (valid) {
            return {
              id: user._id.toString(),
              email: user.email,
              name: user.name,
              role: user.role as UserRole,
              popId: user.popId ?? null,
              birthDate: user.birthDate?.toISOString() ?? null,
            };
          }
          return null;
        }

        const store = await Store.findOne({ email }).select("+passwordHash");
        if (store?.passwordHash) {
          const valid = await bcrypt.compare(password, store.passwordHash);
          if (valid) {
            return {
              id: store._id.toString(),
              email: store.email,
              name: store.name,
              role: "STORE" as UserRole,
              popId: null,
              birthDate: null,
            };
          }
        }

        const player = await Player.findOne({ email }).select("+passwordHash");
        if (player?.passwordHash) {
          const valid = await bcrypt.compare(password, player.passwordHash);
          if (valid) {
            return {
              id: player._id.toString(),
              email: player.email,
              name: player.playerName,
              role: "PLAYER" as UserRole,
              popId: player.popId ?? null,
              birthDate: player.birthDate?.toISOString() ?? null,
            };
          }
        }

        return null;
      },
    }),
  ],
});
