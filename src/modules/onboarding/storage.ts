/**
 * Whether an account has already been walked through the platform, on this
 * device.
 *
 * The record is deliberately local: there is no server field for it, and the
 * point is "do not interrupt someone twice on the machine they work on". It is
 * keyed by user id so signing out and back in — or a second account sharing the
 * browser — does not replay a guide that was already read, and does not swallow
 * one a different account has never seen.
 *
 * There is exactly one flag per account, not one per page. The guide runs the
 * first time an account reaches the dashboard on this browser and then never
 * opens itself again; the only way back to it is the account menu.
 */

const STORAGE_KEY = "wf-onboarding-v2";
/** The per-tour record the previous version wrote. Cleared on sight. */
const LEGACY_KEY = "wf-onboarding-v1";

/** user id → when the guide was completed or dismissed, as epoch ms. */
type Store = Record<string, number>;

function readStore(): Store {
  // A private window can have localStorage present but throwing on access.
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Store;
  } catch {
    return {};
  }
}

function writeStore(store: Store): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Out of quota or storage blocked: the guide simply shows again next time,
    // which is better than breaking the page over a hint.
  }
}

/** True once this account has been offered the guide on this device. */
export function hasOnboarded(userId?: number | string | null): boolean {
  if (typeof window === "undefined" || userId === undefined || userId === null) return false;
  return typeof readStore()[String(userId)] === "number";
}

/**
 * Records the guide as delivered. Called the moment it opens rather than when
 * it closes: an account that reloads the page halfway through has still been
 * shown it, and showing it again is exactly the nagging this flag exists to
 * prevent.
 */
export function markOnboarded(userId?: number | string | null): void {
  if (typeof window === "undefined" || userId === undefined || userId === null) return;
  const key = String(userId);
  const store = readStore();
  if (typeof store[key] === "number") return;
  store[key] = Date.now();
  writeStore(store);
}

/** Clears the record so the guide is offered again. Used by the replay entry. */
export function resetOnboarding(userId?: number | string | null): void {
  if (typeof window === "undefined") return;
  if (userId === undefined || userId === null) {
    writeStore({});
    return;
  }
  const store = readStore();
  delete store[String(userId)];
  writeStore(store);
}
