import type { UserRole } from "@/types/models";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      popId: string | null;
      birthDate: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: UserRole;
    popId: string | null;
    birthDate: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    popId: string | null;
    birthDate: string | null;
  }
}
