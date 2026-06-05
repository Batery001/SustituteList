import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/** Middleware Edge: solo auth.config (sin MongoDB). */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/dashboard/:path*"],
};
