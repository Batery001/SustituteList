import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (!session?.user) {
    const login = new URL("/auth/login", req.url);
    login.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(login);
  }

  const role = session.user.role;

  if (pathname.startsWith("/dashboard/store") && role === "PLAYER") {
    return NextResponse.redirect(new URL("/dashboard/player", req.url));
  }

  if (pathname.startsWith("/dashboard/player") && role === "STORE") {
    return NextResponse.redirect(new URL("/dashboard/store", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*"],
};
