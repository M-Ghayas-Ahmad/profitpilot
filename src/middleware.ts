import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let loggedIn = false;

  if (token) {
    try {
      loggedIn = Boolean(await verifySessionToken(token));
    } catch {
      loggedIn = false;
    }
  }

  const isAuthPage = pathname === "/login" || pathname === "/register";
  const isApp = pathname.startsWith("/app");

  if (isApp && !loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && loggedIn) {
    const url = req.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/login", "/register"],
};
