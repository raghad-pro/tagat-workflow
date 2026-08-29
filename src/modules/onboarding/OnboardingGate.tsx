"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/providers/AuthProvider";
import { OnboardingTour, type ResolvedStep } from "./OnboardingTour";
import { hasOnboarded, markOnboarded } from "./storage";
import { firstRunTour, type Tour } from "./tours";

/** Fired by the "replay the guide" entry in the account menu. */
export const RESTART_EVENT = "wf:onboarding-restart";

/** How long to keep waiting for a page's controls to mount before giving up. */
const SETTLE_MS = 700;
const POLL_MS = 350;
const MAX_POLLS = 8;

/**
 * Runs the guided tour once per account, per device, and never again.
 *
 * Two things are being balanced. A tour must not open over a skeleton — half
 * its targets would not exist yet and the steps would drop out — so it waits
 * for the page to settle and keeps re-resolving until the set of visible
 * targets stops growing. And it must not nag: the account is written off the
 * moment the tour opens, so a refresh, a route change or a second session on
 * the same browser does not bring it back. Only the account menu does.
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
        icon: step.icon,
      }));
  }, []);

  // Only one search at a time; a route change cancels the one in flight.
  const timers = useRef<number[]>([]);
  const clearTimers = () => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
  };

  useEffect(() => {
    // A tour already on screen keeps running: the account is navigating inside
    // its own walkthrough, not asking for a new one.
    if (tour) return;

    clearTimers();
    if (!userId || hasOnboarded(userId)) return;

    const candidate = firstRunTour(pathname);

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

      // A tour with nothing left to point at is not worth spending: leave the
      // account unmarked so it still gets one once a page has content.
      if (best.length === 0) return;

      // Marked as it opens, not as it closes. Someone who reloads halfway
      // through has still been shown the guide, and showing it again is the
      // interruption this whole flag exists to prevent.
      markOnboarded(userId);
      setSteps(best);
      setTour(candidate);
    };

    timers.current.push(window.setTimeout(attempt, SETTLE_MS));
    return clearTimers;
  }, [userId, pathname, resolve, restartToken, tour]);

  useEffect(() => {
    const onRestart = () => {
      setTour(null);
      setSteps([]);
      setRestartToken((token) => token + 1);
    };
    window.addEventListener(RESTART_EVENT, onRestart);
    return () => window.removeEventListener(RESTART_EVENT, onRestart);
  }, []);

  const handleClose = () => {
    setTour(null);
    setSteps([]);
  };

  if (!tour || steps.length === 0) return null;

  return (
    <OnboardingTour key={`${tour.id}:${restartToken}`} steps={steps} onClose={handleClose} />
  );
}
