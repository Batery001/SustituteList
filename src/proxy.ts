import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/** Proxy Edge: auth NextAuth (sin MongoDB). */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
