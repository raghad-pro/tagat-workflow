import { NextRequest, NextResponse } from "next/server";
import { API_ORIGINS, ENV } from "@/config/env";
import { UNREACHABLE_STATUSES } from "@/services/apiFailover";
import {
  LOCALE_COOKIE,
  LOCALE_HEADER,
  landingPathFor,
  localeForLandingPath,
  resolveLocale,
} from "@/i18n/config";

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/verify"];
/** Pointless with a session in hand — a signed-in visitor is sent on to the app instead. */
const SIGNED_OUT_ONLY_ROUTES = ["/login", "/register"];
const DEFAULT_REDIRECT = "/dashboard";

/**
 * The landing page is the one place the URL, not the cookie, decides the
 * language: `/` is always English and `/ar` always Arabic, so each has a
 * stable address a search engine can index and link to. A visitor whose
 * cookie says Arabic is sent from `/` to `/ar` rather than served Arabic at
 * the English address.
 */
function landingResponse(request: NextRequest, pathname: string): NextResponse | null {
  const pathLocale = localeForLandingPath(pathname);
  if (!pathLocale) return null;

  if (pathname === "/") {
    const preferred = resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value);
    if (preferred !== "en") {
      return NextResponse.redirect(new URL(landingPathFor(preferred), request.url));
    }
  }

  const headers = new Headers(request.headers);
  headers.set(LOCALE_HEADER, pathLocale);
  return NextResponse.next({ request: { headers } });
}

/**
 * One dev proxy path per backend host, so the client can fail over between them
 * the same way it does in production (see `src/services/apiFailover.ts`).
 * The longer prefix has to be matched first — it also starts with `/backend-api`.
 */
const PROXY_PREFIXES = [
  { prefix: "/backend-api-fallback", origin: API_ORIGINS.fallback },
  { prefix: "/backend-api", origin: API_ORIGINS.primary },
];

/**
 * A rewrite has to pick its host before the request is sent, and a rewrite to a
 * dead host surfaces as a plain 500 — indistinguishable from a Laravel error,
 * which the client must not retry (it would send writes twice). So the proxy
 * checks the primary host itself and routes around it while it is down.
 */
const HEALTH_TTL_MS = 30_000;
const HEALTH_TIMEOUT_MS = 3_000;

let primaryIsUp = true;
let checkedAt = 0;

async function resolveProxyOrigin(preferred: string): Promise<string> {
  if (preferred !== API_ORIGINS.primary) return preferred;
  if (API_ORIGINS.fallback === API_ORIGINS.primary) return preferred;

  if (Date.now() - checkedAt < HEALTH_TTL_MS) {
    return primaryIsUp ? API_ORIGINS.primary : API_ORIGINS.fallback;
  }

  checkedAt = Date.now();
  try {
    const probe = await fetch(`${API_ORIGINS.primary}/api/v1`, {
      method: "HEAD",
      cache: "no-store",
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    // Any answer means the host is alive — 404 or 405 on the probe is fine.
    primaryIsUp = !UNREACHABLE_STATUSES.includes(probe.status);
  } catch {
    primaryIsUp = false; // never answered: DNS failure, refused, or timed out
  }

  return primaryIsUp ? API_ORIGINS.primary : API_ORIGINS.fallback;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle local proxy to bypass CORS and CSRF
  const proxy = PROXY_PREFIXES.find((entry) => pathname.startsWith(entry.prefix));
  if (proxy) {
    const headers = new Headers(request.headers);
    // Strip origin and referer so Laravel treats the request as stateless
    headers.delete("origin");
    headers.delete("referer");

    // Extract the actual path after the proxy prefix
    const apiPath = pathname.slice(proxy.prefix.length);
    const origin = await resolveProxyOrigin(proxy.origin);
    const backendUrl = new URL(`/api/v1${apiPath}${request.nextUrl.search}`, origin);

    return NextResponse.rewrite(backendUrl, {
      request: {
        headers,
      },
    });
  }

  const landing = landingResponse(request, pathname);
  if (landing) return landing;

  if (ENV.DISABLE_DASHBOARD_PROTECTION) return NextResponse.next();

  const token = request.cookies.get(ENV.ACCESS_TOKEN_KEY)?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && SIGNED_OUT_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL(DEFAULT_REDIRECT, request.url));
  }

  return NextResponse.next();
}

/**
 * Crawler-facing files are listed by name: `robots.txt`, `sitemap.xml` and the
 * manifest used to fall through to the auth redirect and answer 307 → /login,
 * which reads to a search engine as "no robots file, no sitemap".
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|sanctum|favicon.ico|icon|robots.txt|sitemap.xml|manifest.webmanifest|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json|webmanifest)$).*)",
  ],
};