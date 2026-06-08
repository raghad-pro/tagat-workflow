import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@/config/env";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];
const DEFAULT_REDIRECT = "/dashboard";

export function middleware(request: NextRequest) {
  if (ENV.DISABLE_DASHBOARD_PROTECTION) return NextResponse.next();

  const token = request.cookies.get(ENV.ACCESS_TOKEN_KEY)?.value;
  const { pathname } = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};