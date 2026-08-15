import { NextRequest, NextResponse } from "next/server";
import { ENV } from "@/config/env";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/verify"];
const DEFAULT_REDIRECT = "/dashboard";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle local proxy to bypass CORS and CSRF
  if (pathname.startsWith("/backend-api")) {
    const headers = new Headers(request.headers);
    // Strip origin and referer so Laravel treats the request as stateless
    headers.delete("origin");
    headers.delete("referer");
    
    // Extract the actual path after /backend-api
    const apiPath = pathname.replace(/^\/backend-api/, "");
    const backendUrl = new URL(`/api/v1${apiPath}${request.nextUrl.search}`, "https://workflow.aliservice.site");
    
    return NextResponse.rewrite(backendUrl, {
      request: {
        headers,
      },
    });
  }

  if (ENV.DISABLE_DASHBOARD_PROTECTION) return NextResponse.next();

  const token = request.cookies.get(ENV.ACCESS_TOKEN_KEY)?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  ) || pathname === "/";

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|sanctum|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};