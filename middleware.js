import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Better Auth sets a cookie named "better-auth.session_token"
  const session = request.cookies.get("better-auth.session_token");

  // Protected routes — require login
  const protectedPaths = [];
  const isProtected = protectedPaths.some(p => pathname.startsWith(p));

  if (!session && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (session && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sign-in", "/sign-up"],
};