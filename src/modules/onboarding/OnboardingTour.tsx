"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ResolvedStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  padding?: number;
}

interface OnboardingTourProps {
  steps: ResolvedStep[];
  /** Called once, whether the tour was finished or dismissed. */
  onClose: () => void;
}

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const CARD_WIDTH = 320;
const GAP = 14;
const EDGE = 10;

function boxOf(selector?: string, padding = 8): Box | null {
  if (!selector || typeof document === "undefined") return null;
  const element = document.querySelector(selector);
  if (!element) return null;
  const rect = element.getBoundingClientRect();
  // A control that is present but not laid out — a collapsed rail, a hidden
  // mobile branch — must not be spotlighted as an empty sliver.
  if (rect.width < 4 || rect.height < 4) return null;
  return {
    top: rect.top - padding,
    left: rect.left - padding,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  };
}

/**
 * A spotlight walkthrough: one dimmed overlay with a hole punched over the
 * element being explained, and a card beside it.
 *
 * The hole is a `box-shadow` spread rather than an SVG mask or four filler
 * divs — it is one element to position, and it keeps the dimming in a single
 * paint so the highlight never shows a seam while it animates between steps.
 */
export function OnboardingTour({ steps, onClose }: OnboardingTourProps) {
  const t = useTranslations("onboarding");
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: 180 });
  const cardRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  // ── Track the highlighted element ──────────────────────────────────────────
  const measure = useCallback(() => {
    setBox(boxOf(step?.target, step?.padding ?? 8));
  }, [step?.target, step?.padding]);

  useEffect(() => {
    if (!step) return;

    const element = step.target ? document.querySelector(step.target) : null;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });

    // Measure now for the common case, then again after the smooth scroll has
    // settled, so the hole does not sit where the element used to be.
    measure();
    const settle = window.setTimeout(measure, 320);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  useLayoutEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setCardSize({ width: rect.width, height: rect.height });
  }, [index, step?.body, box?.top, box?.left]);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // The page behind must not scroll away from the thing being pointed at.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!step || typeof document === "undefined") return null;

  // ── Card placement ─────────────────────────────────────────────────────────
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const width = Math.min(CARD_WIDTH, viewportWidth - EDGE * 2);

  let cardTop: number;
  let cardLeft: number;

  if (!box) {
    cardTop = Math.max(EDGE, (viewportHeight - cardSize.height) / 2);
    cardLeft = Math.max(EDGE, (viewportWidth - width) / 2);
  } else {
    const below = box.top + box.height + GAP;
    const above = box.top - GAP - cardSize.height;
    cardTop =
      below + cardSize.height <= viewportHeight - EDGE
        ? below
        : above >= EDGE
          ? above
          : Math.max(EDGE, (viewportHeight - cardSize.height) / 2);

    cardLeft = Math.min(
      Math.max(EDGE, box.left + box.width / 2 - width / 2),
      Math.max(EDGE, viewportWidth - width - EDGE)
    );
  }

  const goNext = () => (isLast ? onClose() : setIndex((current) => current + 1));

  return createPortal(
    <div className="fixed inset-0 z-[200]" role="dialog" aria-modal="true" aria-label={t("title")}>
      {/* Dim. Without a highlight it is a plain sheet; with one, the sheet is
          the highlight's own shadow so the hole is exact. */}
      {box ? (
        <div
          aria-hidden
          className="pointer-events-auto absolute rounded-xl transition-all duration-300 ease-out"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
            boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.66)",
            outline: "2px solid var(--color-btn-brand)",
            outlineOffset: "2px",
          }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0" style={{ background: "rgba(2, 6, 23, 0.66)" }} />
      )}

      <div
        ref={cardRef}
        className={cn(
          "absolute flex flex-col gap-3 rounded-2xl border ds-border-form ds-bg-form p-4 shadow-2xl",
          "transition-[top,left] duration-300 ease-out"
        )}
        style={{ top: cardTop, left: cardLeft, width }}
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[15px] font-bold ds-text-primary">{step.title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("skip")}
            className="shrink-0 rounded-lg p-1 ds-text-gray-200 transition-colors hover:text-[var(--color-btn-brand)]"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[13px] leading-relaxed ds-text-gray-200">{step.body}</p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((dot, dotIndex) => (
              <span
                key={dot.id}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  dotIndex === index
                    ? "w-4 bg-[var(--color-btn-brand)]"
                    : "w-1.5 bg-slate-300 dark:bg-slate-600"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                type="button"
                onClick={() => setIndex((current) => current - 1)}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ds-text-gray-200 transition-colors hover:text-[var(--color-btn-brand)]"
              >
                {t("back")}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ds-text-gray-200 transition-colors hover:text-[var(--color-btn-brand)]"
            >
              {t("skip")}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-[var(--color-btn-brand)] px-3.5 py-1.5 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
            >
              {isLast ? t("done") : t("next")}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
