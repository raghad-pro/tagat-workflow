/**
 * Which guided tours an account has already been shown, on this device.
 *
 * The record is deliberately local: there is no server field for it, and the
 * point is "do not interrupt someone twice on the machine they work on". It is
 * keyed by user id so signing out and back in — or a second account sharing the
 * browser — does not replay a tour that was already read, and does not swallow
 * one a different account has never seen.
 */

const STORAGE_KEY = "wf-onboarding-v1";

type Store = Record<string, string[]>;

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
  } catch {
    // Out of quota or storage blocked: the tour simply shows again next time,
    // which is better than breaking the page over a hint.
  }
}

/** Tour ids this account has already finished or dismissed. */
export function seenTours(userId?: number | string | null): string[] {
  if (typeof window === "undefined" || userId === undefined || userId === null) return [];
  const seen = readStore()[String(userId)];
  return Array.isArray(seen) ? seen : [];
}

export function hasSeenTour(userId: number | string | null | undefined, tourId: string): boolean {
  return seenTours(userId).includes(tourId);
}

/** Records a tour as read. Dismissing counts: it was offered, and declined. */
export function markTourSeen(userId: number | string | null | undefined, tourId: string): void {
  if (typeof window === "undefined" || userId === undefined || userId === null) return;
  const key = String(userId);
  const store = readStore();
  const seen = Array.isArray(store[key]) ? store[key] : [];
  if (seen.includes(tourId)) return;
  store[key] = [...seen, tourId];
  writeStore(store);
}

/** Clears the record so every tour is offered again. Used by the replay entry. */
export function resetOnboarding(userId?: number | string | null): void {
  if (typeof window === "undefined") return;
  const store = readStore();
  if (userId === undefined || userId === null) {
    writeStore({});
    return;
  }
  delete store[String(userId)];
  writeStore(store);
}
