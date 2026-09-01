import { ENV } from "@/config/env";

/**
 * Automatic failover between the two backend hosts.
 *
 * Everything starts on the primary host. The first request that cannot reach it
 * — DNS failure, refused connection, timeout, or a gateway error — flips the
 * whole app over to the second host and is retried there, so the user only ever
 * sees the delay of that one request. After `COOLDOWN_MS` the primary gets
 * another chance; if it is still down the next failure flips back immediately.
 *
 * Only "the host never answered" counts as a failure here. A real answer from
 * the backend — 404, 422, even a Laravel 500 — is a working host and must not
 * cause a retry, otherwise a failed POST would be sent twice.
 */

/** Statuses a proxy/CDN returns when the origin behind it is unreachable. */
export const UNREACHABLE_STATUSES = [502, 503, 504, 521, 522, 523, 524];

/** How long the app stays on the fallback before probing the primary again. */
const COOLDOWN_MS = 5 * 60 * 1000;
const STORAGE_KEY = "workflow:api-failover";

type Target = "primary" | "fallback";
type Pair = { primary: string; fallback: string };

/** Base URLs as the app uses them (a proxy path in dev, absolute in prod). */
const PROXIED: Pair = {
  primary: ENV.API_URL,
  fallback: ENV.API_URL_FALLBACK,
};
/** The same hosts, always absolute — used by callers that skip the dev proxy. */
const DIRECT: Pair = {
  primary: ENV.API_URL_DIRECT,
  fallback: ENV.API_URL_DIRECT_FALLBACK,
};
/** Uploaded files follow the API: same outage, same host. */
const FILES: Pair = {
  primary: ENV.FILES_URL,
  fallback: ENV.FILES_URL_FALLBACK,
};

let target: Target = "primary";
let switchedAt = 0;

// Restore the choice made before a reload: during an outage that saves every
// page load from waiting on the dead host all over again.
if (typeof window !== "undefined") {
  try {
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = saved ? (JSON.parse(saved) as { switchedAt?: number }) : null;
    if (parsed?.switchedAt && Date.now() - parsed.switchedAt < COOLDOWN_MS) {
      target = "fallback";
      switchedAt = parsed.switchedAt;
    }
  } catch {
    // Storage disabled or holding junk — start on the primary.
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    if (target === "fallback") {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ switchedAt }));
    } else {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Storage disabled — in-memory state still works for this page.
  }
}

function switchTo(next: Target) {
  target = next;
  switchedAt = next === "fallback" ? Date.now() : 0;
  persist();
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[api] switched to the ${next} backend host`);
  }
}

function resolve(pair: Pair): string {
  // The cooldown expired — give the primary another chance.
  if (target === "fallback" && Date.now() - switchedAt > COOLDOWN_MS) {
    switchTo("primary");
  }
  return target === "fallback" && pair.fallback ? pair.fallback : pair.primary;
}

function pairFor(baseUrl: string): Pair {
  if (baseUrl === DIRECT.primary || baseUrl === DIRECT.fallback) return DIRECT;
  if (baseUrl === FILES.primary || baseUrl === FILES.fallback) return FILES;
  return PROXIED;
}

function hasFallback(pair: Pair): boolean {
  return Boolean(pair.fallback) && pair.fallback !== pair.primary;
}

/** Base URL every API request should use right now. */
export const getApiBaseUrl = () => resolve(PROXIED);

/** Same, but always absolute — for callers that bypass the dev proxy. */
export const getDirectApiBaseUrl = () => resolve(DIRECT);

/** Where `/storage` files should be loaded from right now. */
export const getFilesBaseUrl = () => resolve(FILES);

/**
 * A request to `triedBaseUrl` failed because the host never answered.
 *
 * Returns the base URL to retry on, or `null` when there is nothing left to
 * try. Concurrent requests are handled: if another failure already switched
 * hosts, this one just gets the new host without switching again.
 */
export function reportUnreachable(triedBaseUrl: string): string | null {
  const pair = pairFor(triedBaseUrl);
  if (!hasFallback(pair)) return null;

  const active = resolve(pair);
  if (active !== triedBaseUrl) return active;

  switchTo(target === "primary" ? "fallback" : "primary");
  const next = resolve(pair);
  return next === triedBaseUrl ? null : next;
}

/** The primary answered again — stop routing around it. */
export function reportReachable(baseUrl: string | undefined) {
  if (!baseUrl || target === "primary") return;
  if (baseUrl === pairFor(baseUrl).primary) switchTo("primary");
}
