import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/types/models";

function getAuthSecret(): string | undefined {
  return (
    process.env.AUTH_SECRET?.trim() ?? process.env.SESSION_SECRET?.trim()
  );
}

/** Config compatible con Edge (proxy). Sin MongoDB ni bcrypt. */
export const authConfig = {
  secret: getAuthSecret(),
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.popId = user.popId;
        token.birthDate = user.birthDate;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.popId = (token.popId as string | null) ?? null;
        session.user.birthDate = (token.birthDate as string | null) ?? null;
      }
      return session;
    },
    authorized({ auth, request }) {
      const pathname = request.nextUrl.pathname;

      if (!pathname.startsWith("/dashboard")) {
        return true;
      }

      if (!auth?.user) {
        return false;
      }

      const role = auth.user.role;

      if (pathname.startsWith("/dashboard/store") && role === "PLAYER") {
        return Response.redirect(
          new URL("/dashboard/player", request.nextUrl)
        );
      }

      if (pathname.startsWith("/dashboard/player") && role === "STORE") {
        return Response.redirect(
          new URL("/dashboard/store", request.nextUrl)
        );
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
