"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { OnboardingTour, type ResolvedStep } from "./OnboardingTour";
import { markTourSeen, seenTours } from "./storage";
import { WELCOME_TOUR, tourForPath, type Tour } from "./tours";

/** Fired by the "replay the guide" entry in the account menu. */
export const RESTART_EVENT = "wf:onboarding-restart";

/** How long to keep waiting for a page's controls to mount before giving up. */
const SETTLE_MS = 700;
const POLL_MS = 350;
const MAX_POLLS = 8;

/**
 * Decides which guided tour to run, if any, and remembers that it ran.
 *
 * Two things are being balanced. A tour must not open over a skeleton — half
 * its targets would not exist yet and the steps would drop out — so it waits
 * for the page to settle and keeps re-resolving until the set of visible
 * targets stops growing. And it must not nag: a tour is written off the moment
 * it is closed, finished or skipped alike.
 */
export function OnboardingGate() {
  const { user } = useAuth();
  const pathname = usePathname();
  const t = useTranslations("onboarding");

  const [tour, setTour] = useState<Tour | null>(null);
  const [steps, setSteps] = useState<ResolvedStep[]>([]);

  /**
   * `useTranslations` hands back a fresh function on every render. Reading it
   * through a ref keeps it out of the effect's dependencies — otherwise the
   * effect would re-run on every render it caused, and never settle.
   */
  const translate = useRef(t);
  translate.current = t;
  // Bumped by the replay entry to re-run the search on the current page.
  const [restartToken, setRestartToken] = useState(0);

  const userId = user?.id;

  /** The next tour this account has not read on this page, welcome first. */
  const nextTour = useCallback((): Tour | null => {
    if (!userId) return null;
    const seen = seenTours(userId);
    if (!seen.includes(WELCOME_TOUR.id)) return WELCOME_TOUR;
    const pageTour = tourForPath(pathname);
    if (!pageTour || seen.includes(pageTour.id)) return null;
    return pageTour;
  }, [userId, pathname]);

  /** Steps whose target is actually on screen. Untargeted steps always keep. */
  const resolve = useCallback((candidate: Tour): ResolvedStep[] => {
    const tr = translate.current;
    return candidate.steps
      .filter((step) => !step.target || document.querySelector(step.target) !== null)
      .map((step) => ({
        id: step.id,
        title: tr(`${step.copy}.title`),
        body: tr(`${step.copy}.body`),
        target: step.target,
        padding: step.padding,
      }));
  }, []);

  // Only one search at a time; a route change cancels the one in flight.
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => {
    clearTimers();
    setTour(null);
    // Replacing an already-empty array would re-render for nothing, and this
    // effect runs on every route change.
    setSteps((current) => (current.length === 0 ? current : []));

    const candidate = nextTour();
    if (!candidate) return;

    let polls = 0;
    let best: ResolvedStep[] = [];

    const attempt = () => {
      const resolved = resolve(candidate);
      // Still filling in — a table that mounted after the header, a button
      // behind a permission check that has just resolved. Keep the best set so
      // far and look again.
      if (resolved.length > best.length) best = resolved;

      polls += 1;
      const settled = resolved.length === candidate.steps.length || polls >= MAX_POLLS;
      if (!settled) {
        timers.current.push(window.setTimeout(attempt, POLL_MS));
        return;
      }

      // A tour with nothing left to point at is not worth spending: leave it
      // unread so the account still gets it once the page has content.
      if (best.length === 0) return;
      setSteps(best);
      setTour(candidate);
    };

    timers.current.push(window.setTimeout(attempt, SETTLE_MS));
    return clearTimers;
  }, [nextTour, resolve, restartToken]);

  useEffect(() => {
    const onRestart = () => setRestartToken((token) => token + 1);
    window.addEventListener(RESTART_EVENT, onRestart);
    return () => window.removeEventListener(RESTART_EVENT, onRestart);
  }, []);

  const handleClose = () => {
    if (tour) markTourSeen(userId, tour.id);
    setTour(null);
    setSteps([]);
    // The welcome tour ends on a page that has its own hints; run them straight
    // away rather than making the account come back for them.
    setRestartToken((token) => token + 1);
  };

  if (!tour || steps.length === 0) return null;

  return <OnboardingTour key={tour.id} steps={steps} onClose={handleClose} />;
}
