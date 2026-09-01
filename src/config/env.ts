
const stripTrailingSlash = (url: string) => url.replace(/\/+$/, "");

/**
 * The two backend hosts.
 *
 * `primary` serves everything; `fallback` takes over automatically whenever the
 * primary host cannot be reached (see `src/services/apiFailover.ts`), so a dead
 * domain does not take the whole app down with it.
 */
export const API_ORIGINS = {
  primary: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_ORIGIN || "https://workflow.aliservice.site"
  ),
  fallback: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_ORIGIN_FALLBACK || "https://work.aliservice.site"
  ),
} as const;

/** Absolute API roots — what the browser talks to in production. */
const API_DIRECT = {
  primary: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL || `${API_ORIGINS.primary}/api/v1`
  ),
  fallback: stripTrailingSlash(
    process.env.NEXT_PUBLIC_API_URL_FALLBACK || `${API_ORIGINS.fallback}/api/v1`
  ),
} as const;

const isDev = process.env.NODE_ENV === "development";

export const ENV = {
  /**
   * In development requests go through the middleware proxy (bypasses CORS and
   * CSRF), which exposes one path per host — `/backend-api` for the primary,
   * `/backend-api-fallback` for the second one.
   */
  API_URL: isDev ? "/backend-api" : API_DIRECT.primary,
  API_URL_FALLBACK: isDev ? "/backend-api-fallback" : API_DIRECT.fallback,
  /** The same two hosts, always absolute — for callers that skip the dev proxy. */
  API_URL_DIRECT: API_DIRECT.primary,
  API_URL_DIRECT_FALLBACK: API_DIRECT.fallback,
  API_TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  /**
   * Where uploaded files are served from.
   *
   * Not derivable from `API_URL`: that is the API prefix (`/api/v1`, or the dev
   * proxy path), while uploads live under `/storage`. Attachments come back as
   * storage-relative paths like `messages/ab12….png` and need this in front.
   */
  FILES_URL:
    process.env.NEXT_PUBLIC_FILES_URL || `${API_ORIGINS.primary}/storage`,
  FILES_URL_FALLBACK:
    process.env.NEXT_PUBLIC_FILES_URL_FALLBACK ||
    `${API_ORIGINS.fallback}/storage`,
  ACCESS_TOKEN_KEY: process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || "accessToken",
  REFRESH_TOKEN_KEY: process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || "refreshToken",
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || "Workflow",
  APP_VERSION: "1.0.0",
  APP_ENV: process.env.NODE_ENV || "development",
  DISABLE_DASHBOARD_PROTECTION: process.env.NEXT_PUBLIC_DISABLE_DASHBOARD_PROTECTION === "true",
  IS_MOCK: process.env.NEXT_PUBLIC_IS_MOCK === "true",
};
