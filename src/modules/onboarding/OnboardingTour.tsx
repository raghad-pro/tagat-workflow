"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import {
  BarChart3,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Compass,
  LayoutGrid,
  Menu,
  PanelLeft,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Table2,
  X,
} from "lucide-react";

/** The glyphs a step may put in the card's badge, named so tours stay data. */
const ICONS = {
  sparkles: Sparkles,
  sidebar: PanelLeft,
  menu: Menu,
  bell: Bell,
  plus: Plus,
  search: Search,
  table: Table2,
  hubs: LayoutGrid,
  stats: BarChart3,
  board: Columns3,
  compass: Compass,
  rocket: Rocket,
} as const;

export type StepIcon = keyof typeof ICONS;

/**
 * The second stop of each badge's gradient. The first is always the brand, so
 * the badges read as one family while still telling you the step changed —
 * nine identical teal squares in a row look like nothing moved.
 */
const ICON_HUE: Record<StepIcon, string> = {
  sparkles: "#7c5cff",
  sidebar: "#3b82f6",
  menu: "#0ea5e9",
  bell: "#f59e0b",
  plus: "#22c55e",
  search: "#06b6d4",
  table: "#8b5cf6",
  hubs: "#ec4899",
  stats: "#14b8a6",
  board: "#6366f1",
  compass: "#2dd4bf",
  rocket: "#f43f5e",
};

export interface ResolvedStep {
  id: string;
  title: string;
  body: string;
  target?: string;
  padding?: number;
  icon?: StepIcon;
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

type Placement = "bottom" | "top" | "start" | "end" | "center";

const CARD_WIDTH = 356;
const GAP = 36;
const EDGE = 12;

function boxOf(selector?: string, padding = 10): Box | null {
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

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), Math.max(min, max));

/**
 * The tour's own stylesheet, shipped with the component.
 *
 * Everything here is either an animation or a glass surface — both need
 * pseudo-elements and keyframes, which inline styles cannot express — while
 * anything that depends on a measurement stays an inline style. Colours are
 * read from the design tokens, so the card follows the theme without a second
 * palette to keep in sync.
 */
const STYLES = `
.wf-tour-root { position: fixed; inset: 0; z-index: 200; }

/* The veil: four panels around the highlight rather than one sheet with a
   hole, because a backdrop-filter cannot be punched through — and blurring the
   page behind the dimming is what separates "a modal is open" from "look
   here". */
.wf-tour-veil {
  position: absolute;
  background: rgba(2, 6, 23, 0.52);
  backdrop-filter: blur(5px) saturate(0.85);
  -webkit-backdrop-filter: blur(5px) saturate(0.85);
  transition: top .42s cubic-bezier(.22,1,.36,1), left .42s cubic-bezier(.22,1,.36,1),
              width .42s cubic-bezier(.22,1,.36,1), height .42s cubic-bezier(.22,1,.36,1);
  animation: wf-tour-fade .35s ease-out both;
}

/* The spotlight. */
.wf-tour-ring {
  position: absolute;
  border-radius: 14px;
  border: 1.5px solid color-mix(in srgb, var(--color-btn-brand) 85%, transparent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, var(--color-btn-brand) 16%, transparent),
    0 0 38px color-mix(in srgb, var(--color-btn-brand) 34%, transparent);
  pointer-events: none;
  transition: all .42s cubic-bezier(.22,1,.36,1);
}
.wf-tour-halo {
  position: absolute;
  border-radius: 16px;
  border: 2px solid var(--color-btn-brand);
  pointer-events: none;
  transition: all .42s cubic-bezier(.22,1,.36,1);
  animation: wf-tour-halo 2.4s ease-out infinite;
}
/* Corner brackets: they read as "this exact thing", where a rectangle alone
   reads as "somewhere in here". */
.wf-tour-corner {
  position: absolute;
  width: 14px; height: 14px;
  border-style: solid;
  border-color: var(--color-btn-brand);
  border-radius: 3px;
  pointer-events: none;
  animation: wf-tour-fade .4s ease-out both;
  transition: all .42s cubic-bezier(.22,1,.36,1);
}

/* The card. */
/* The entrance runs once — the element is never re-keyed, only repositioned —
   so the transition below is what carries it from step to step. Without it the
   card teleports while the veil and the ring glide, and the whole frame comes
   apart. */
.wf-tour-pop {
  position: absolute;
  animation: wf-tour-pop-in .42s cubic-bezier(.16,1,.3,1) both;
  transition:
    top .42s cubic-bezier(.22,1,.36,1),
    left .42s cubic-bezier(.22,1,.36,1),
    width .42s cubic-bezier(.22,1,.36,1);
}

.wf-tour-card {
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  padding: 16px 16px 14px;
  background:
    linear-gradient(150deg,
      color-mix(in srgb, var(--color-bg-form) 84%, transparent),
      color-mix(in srgb, var(--color-bg-form) 68%, transparent));
  backdrop-filter: blur(26px) saturate(1.7);
  -webkit-backdrop-filter: blur(26px) saturate(1.7);
  border: 1px solid color-mix(in srgb, var(--color-btn-brand) 26%, transparent);
  box-shadow:
    0 28px 70px -18px rgba(2, 6, 23, .62),
    inset 0 1px 0 rgba(255, 255, 255, .16);
}
/* A brand-tinted light along the top edge, so the glass has a source. */
.wf-tour-card::before {
  content: "";
  position: absolute;
  inset-inline: 14%;
  top: 0; height: 1px;
  background: linear-gradient(90deg, transparent,
    color-mix(in srgb, var(--color-btn-brand) 90%, transparent), transparent);
}

/* Slow-drifting colour behind the glass. Decorative, and the only thing on the
   card that keeps moving while a step is being read. */
.wf-tour-aurora {
  position: absolute;
  width: 190px; height: 190px;
  border-radius: 50%;
  filter: blur(38px);
  opacity: .5;
  pointer-events: none;
}
.wf-tour-aurora.one {
  inset-inline-start: -60px; top: -80px;
  background: var(--color-btn-brand);
  animation: wf-tour-drift 13s ease-in-out infinite;
}
.wf-tour-aurora.two {
  inset-inline-end: -70px; bottom: -90px;
  background: #7c5cff;
  opacity: .34;
  animation: wf-tour-drift 17s ease-in-out infinite reverse;
}

.wf-tour-content { position: relative; animation: wf-tour-step-in .34s cubic-bezier(.16,1,.3,1) both; }

/* The pointer: a drawn arrow spanning the gap from the card to the highlight,
   head resting on the target. A 14px diamond on the card's edge reads as a
   speech-bubble tail — decoration. An arrow reads as an instruction. */
.wf-tour-pointer {
  position: absolute;
  overflow: visible;
  pointer-events: none;
  fill: none;
  stroke: var(--color-btn-brand);
  stroke-width: 2.5;
  stroke-linecap: round;
  filter: drop-shadow(0 0 7px color-mix(in srgb, var(--color-btn-brand) 55%, transparent));
  transition:
    top .42s cubic-bezier(.22,1,.36,1),
    left .42s cubic-bezier(.22,1,.36,1),
    width .42s cubic-bezier(.22,1,.36,1),
    height .42s cubic-bezier(.22,1,.36,1);
}
.wf-tour-pointer .wf-tour-head { fill: var(--color-btn-brand); stroke: none; }
/* A slow nudge along its own axis, so the eye follows it to the target. */
.wf-tour-pointer.v { animation: wf-tour-point-v 1.8s ease-in-out infinite; }
.wf-tour-pointer.h { animation: wf-tour-point-h 1.8s ease-in-out infinite; }

/* Card furniture. */
.wf-tour-badge {
  display: grid; place-items: center;
  width: 38px; height: 38px;
  flex: none;
  border-radius: 13px;
  color: #fff;
  background: linear-gradient(135deg, var(--color-btn-brand), #7c5cff);
  box-shadow: 0 8px 20px -6px color-mix(in srgb, var(--color-btn-brand) 70%, transparent);
}
.wf-tour-chip {
  font-size: 10.5px; font-weight: 800; letter-spacing: .04em;
  padding: 3px 9px; border-radius: 999px;
  color: var(--color-btn-brand);
  background: color-mix(in srgb, var(--color-btn-brand) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-btn-brand) 24%, transparent);
  white-space: nowrap;
}
.wf-tour-title { font-size: 15.5px; font-weight: 800; line-height: 1.35; color: var(--color-text-primary); }
.wf-tour-body {
  font-size: 12.8px; line-height: 1.7;
  color: color-mix(in srgb, var(--color-text-primary) 78%, transparent);
}

.wf-tour-progress {
  position: relative; height: 3px; border-radius: 999px; overflow: hidden;
  background: color-mix(in srgb, var(--color-text-primary) 16%, transparent);
}
.wf-tour-progress-fill {
  position: absolute; inset-block: 0; inset-inline-start: 0;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--color-btn-brand), #7c5cff);
  transition: width .4s cubic-bezier(.16,1,.3,1);
}

/* Dots are buttons: a step already read is one click away again. */
.wf-tour-dot {
  height: 6px; width: 6px; border-radius: 999px; border: 0; padding: 0;
  cursor: pointer;
  background: color-mix(in srgb, var(--color-text-primary) 34%, transparent);
  transition: width .25s ease, background .25s ease, transform .18s ease;
}
.wf-tour-dot:hover { transform: scale(1.45); background: color-mix(in srgb, var(--color-btn-brand) 70%, transparent); }
.wf-tour-dot.done { background: color-mix(in srgb, var(--color-btn-brand) 55%, transparent); }
.wf-tour-dot.now  { width: 18px; background: linear-gradient(90deg, var(--color-btn-brand), #7c5cff); }

.wf-tour-btn {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 700;
  border: 0; cursor: pointer; border-radius: 10px;
  padding: 7px 10px;
  background: transparent;
  color: color-mix(in srgb, var(--color-text-primary) 80%, transparent);
  transition: color .2s ease, background .2s ease, transform .18s ease;
}
.wf-tour-btn:hover { color: var(--color-btn-brand); background: color-mix(in srgb, var(--color-btn-brand) 10%, transparent); }
.wf-tour-btn:active { transform: scale(.96); }

.wf-tour-next {
  position: relative; overflow: hidden;
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12.5px; font-weight: 800;
  border: 0; cursor: pointer; border-radius: 11px;
  padding: 8px 14px;
  color: #fff;
  background: linear-gradient(120deg, var(--color-btn-brand), #7c5cff);
  box-shadow: 0 10px 22px -10px color-mix(in srgb, var(--color-btn-brand) 90%, transparent);
  transition: transform .18s ease, box-shadow .2s ease;
}
.wf-tour-next:hover { transform: translateY(-1px); box-shadow: 0 14px 26px -10px color-mix(in srgb, var(--color-btn-brand) 95%, transparent); }
.wf-tour-next:active { transform: scale(.97); }
/* A light sweeps across the button on hover — the one flourish on a control. */
.wf-tour-next::after {
  content: ""; position: absolute; inset-block: 0; width: 42%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.42), transparent);
  transform: translateX(-160%);
}
.wf-tour-next:hover::after { animation: wf-tour-sheen .75s ease-out; }

.wf-tour-close {
  display: grid; place-items: center;
  width: 26px; height: 26px; flex: none;
  border: 0; cursor: pointer; border-radius: 9px;
  background: transparent;
  color: color-mix(in srgb, var(--color-text-primary) 62%, transparent);
  transition: color .2s ease, background .2s ease, transform .2s ease;
}
.wf-tour-close:hover { color: var(--color-btn-brand); background: color-mix(in srgb, var(--color-btn-brand) 12%, transparent); transform: rotate(90deg); }

.wf-tour-hint {
  font-size: 10.5px; font-weight: 600;
  color: color-mix(in srgb, var(--color-text-primary) 55%, transparent);
}
.wf-tour-key {
  display: inline-block; padding: 0 4px; margin: 0 2px;
  border-radius: 4px; font-weight: 800;
  background: color-mix(in srgb, var(--color-text-primary) 16%, transparent);
}

@keyframes wf-tour-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes wf-tour-pop-in {
  from { opacity: 0; transform: scale(.94) translateY(12px) }
  to   { opacity: 1; transform: none }
}
@keyframes wf-tour-step-in {
  from { opacity: 0; transform: translateY(7px) }
  to   { opacity: 1; transform: none }
}
@keyframes wf-tour-halo {
  0%   { opacity: .5; transform: scale(1) }
  70%  { opacity: 0;  transform: scale(1.045) }
  100% { opacity: 0;  transform: scale(1.045) }
}
@keyframes wf-tour-drift {
  0%   { transform: translate3d(0,0,0) scale(1) }
  50%  { transform: translate3d(14%,-10%,0) scale(1.18) }
  100% { transform: translate3d(0,0,0) scale(1) }
}
@keyframes wf-tour-point-v {
  0%, 100% { transform: translateY(3px) }
  50%      { transform: translateY(-3px) }
}
@keyframes wf-tour-point-h {
  0%, 100% { transform: translateX(3px) }
  50%      { transform: translateX(-3px) }
}
@keyframes wf-tour-sheen {
  from { transform: translateX(-160%) }
  to   { transform: translateX(320%) }
}

@media (prefers-reduced-motion: reduce) {
  .wf-tour-veil, .wf-tour-ring, .wf-tour-halo, .wf-tour-corner,
  .wf-tour-pop, .wf-tour-pointer, .wf-tour-content, .wf-tour-aurora,
  .wf-tour-progress-fill, .wf-tour-next::after {
    animation: none !important;
    transition: none !important;
  }
}
`;

/**
 * A spotlight walkthrough: the page is blurred and dimmed everywhere except the
 * control being explained, and a glass card sits beside it with an arrow back
 * to the highlight.
 *
 * The steps are navigable rather than a slideshow — dots jump, arrow keys walk,
 * Escape leaves — because a guide someone cannot step back inside is one they
 * stop reading and dismiss.
 */
export function OnboardingTour({ steps, onClose }: OnboardingTourProps) {
  const t = useTranslations("onboarding");
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardSize, setCardSize] = useState({ width: CARD_WIDTH, height: 210 });
  const popRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;
  const Icon = ICONS[step?.icon ?? "sparkles"];

  // ── Track the highlighted element ──────────────────────────────────────────
  const measure = useCallback(() => {
    setBox(boxOf(step?.target, step?.padding ?? 10));
  }, [step?.target, step?.padding]);

  useEffect(() => {
    if (!step) return;

    const element = step.target ? document.querySelector(step.target) : null;
    element?.scrollIntoView({ block: "center", behavior: "smooth" });

    // Measure now for the common case, then again after the smooth scroll has
    // settled, so the hole does not sit where the element used to be.
    measure();
    const settle = window.setTimeout(measure, 340);

    // A target can change shape without the window doing anything — a row
    // loading in, a badge arriving — and the hole has to follow it.
    const observer =
      element && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (element) observer?.observe(element);

    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(settle);
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [step, measure]);

  useLayoutEffect(() => {
    const node = popRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    setCardSize({ width: rect.width, height: rect.height });
  }, [index, step?.body, box?.top, box?.left]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goNext = useCallback(
    () => setIndex((current) => (current >= steps.length - 1 ? current : current + 1)),
    [steps.length]
  );
  const goBack = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

  useEffect(() => {
    const rtl = document.documentElement.dir === "rtl";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") return onClose();
      if (event.key === "ArrowRight") return rtl ? goBack() : goNext();
      if (event.key === "ArrowLeft") return rtl ? goNext() : goBack();
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (index === steps.length - 1) onClose();
        else goNext();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, goNext, goBack, index, steps.length]);

  // The page behind must not scroll away from the thing being pointed at.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!step || typeof document === "undefined") return null;

  const rtl = document.documentElement.dir === "rtl";
  const Forward = rtl ? ChevronLeft : ChevronRight;
  const Backward = rtl ? ChevronRight : ChevronLeft;

  // ── Card placement ─────────────────────────────────────────────────────────
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(CARD_WIDTH, vw - EDGE * 2);

  let placement: Placement = "center";
  let cardTop = Math.max(EDGE, (vh - cardSize.height) / 2);
  let cardLeft = Math.max(EDGE, (vw - width) / 2);

  if (box) {
    const below = vh - (box.top + box.height) - GAP - EDGE;
    const above = box.top - GAP - EDGE;
    const afterEnd = vw - (box.left + box.width) - GAP - EDGE;
    const beforeStart = box.left - GAP - EDGE;

    if (cardSize.height <= below) placement = "bottom";
    else if (cardSize.height <= above) placement = "top";
    else if (width <= afterEnd) placement = "end";
    else if (width <= beforeStart) placement = "start";

    if (placement === "bottom" || placement === "top") {
      cardTop =
        placement === "bottom" ? box.top + box.height + GAP : box.top - GAP - cardSize.height;
      cardLeft = clamp(box.left + box.width / 2 - width / 2, EDGE, vw - width - EDGE);
    } else if (placement === "end" || placement === "start") {
      cardLeft = placement === "end" ? box.left + box.width + GAP : box.left - GAP - width;
      cardTop = clamp(
        box.top + box.height / 2 - cardSize.height / 2,
        EDGE,
        vh - cardSize.height - EDGE
      );
    }
  }

  /**
   * The pointer lives in viewport coordinates, not the card's, so it can span
   * the whole gap and rest its head on the highlight however far the card had
   * to be clamped away from the target's centre.
   */
  const vertical = placement === "bottom" || placement === "top";
  let pointer: { style: React.CSSProperties; flip: boolean } | null = null;

  if (box && placement !== "center") {
    if (vertical) {
      const x = clamp(box.left + box.width / 2, cardLeft + 26, cardLeft + width - 26);
      pointer = {
        // Card above the target means the arrow has to point down at it.
        flip: placement === "top",
        style: {
          top: placement === "bottom" ? box.top + box.height : box.top - GAP,
          left: x - 13,
        },
      };
    } else {
      const y = clamp(
        box.top + box.height / 2,
        cardTop + 26,
        cardTop + cardSize.height - 26
      );
      pointer = {
        flip: placement === "start",
        style: {
          left: placement === "end" ? box.left + box.width : box.left - GAP,
          top: y - 13,
        },
      };
    }
  }

  const veils: React.CSSProperties[] = box
    ? [
        { top: 0, left: 0, width: vw, height: Math.max(0, box.top) },
        {
          top: Math.min(vh, box.top + box.height),
          left: 0,
          width: vw,
          height: Math.max(0, vh - box.top - box.height),
        },
        { top: Math.max(0, box.top), left: 0, width: Math.max(0, box.left), height: box.height },
        {
          top: Math.max(0, box.top),
          left: Math.min(vw, box.left + box.width),
          width: Math.max(0, vw - box.left - box.width),
          height: box.height,
        },
      ]
    : [{ top: 0, left: 0, width: vw, height: vh }];

  const corners: React.CSSProperties[] = box
    ? [
        { top: box.top - 4, left: box.left - 4, borderWidth: "2.5px 0 0 2.5px" },
        { top: box.top - 4, left: box.left + box.width - 10, borderWidth: "2.5px 2.5px 0 0" },
        { top: box.top + box.height - 10, left: box.left - 4, borderWidth: "0 0 2.5px 2.5px" },
        {
          top: box.top + box.height - 10,
          left: box.left + box.width - 10,
          borderWidth: "0 2.5px 2.5px 0",
        },
      ]
    : [];

  return createPortal(
    <div className="wf-tour-root" role="dialog" aria-modal="true" aria-label={t("title")}>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />

      {veils.map((style, veilIndex) => (
        <div key={veilIndex} aria-hidden className="wf-tour-veil" style={style} />
      ))}

      {box && (
        <>
          <div
            aria-hidden
            className="wf-tour-ring"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          <div
            aria-hidden
            className="wf-tour-halo"
            style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
          />
          {corners.map((corner, cornerIndex) => (
            <div key={cornerIndex} aria-hidden className="wf-tour-corner" style={corner} />
          ))}
        </>
      )}

      {pointer && (
        <svg
          aria-hidden
          className={`wf-tour-pointer ${vertical ? "v" : "h"}`}
          style={pointer.style}
          width={vertical ? 26 : GAP}
          height={vertical ? GAP : 26}
          viewBox={vertical ? `0 0 26 ${GAP}` : `0 0 ${GAP} 26`}
        >
          {/* Drawn once pointing up (or, horizontally, towards the start) and
              mirrored for the opposite side, so there is one set of numbers to
              get right rather than four. */}
          <g
            transform={
              pointer.flip
                ? vertical
                  ? `scale(1,-1) translate(0,${-GAP})`
                  : `scale(-1,1) translate(${-GAP},0)`
                : undefined
            }
          >
            {vertical ? (
              <>
                <path d={`M13 ${GAP - 2} L13 13`} />
                <path className="wf-tour-head" d="M13 2 L5 15 L21 15 Z" />
              </>
            ) : (
              <>
                <path d={`M${GAP - 2} 13 L13 13`} />
                <path className="wf-tour-head" d="M2 13 L15 5 L15 21 Z" />
              </>
            )}
          </g>
        </svg>
      )}

      <div ref={popRef} className="wf-tour-pop" style={{ top: cardTop, left: cardLeft, width }}>
        <div className="wf-tour-card">
          <div aria-hidden className="wf-tour-aurora one" />
          <div aria-hidden className="wf-tour-aurora two" />

          <div className="wf-tour-content" key={step.id}>
            <div className="flex items-start gap-3">
              <div
                className="wf-tour-badge"
                style={{
                  background: `linear-gradient(135deg, var(--color-btn-brand), ${
                    ICON_HUE[step.icon ?? "sparkles"]
                  })`,
                }}
              >
                <Icon size={19} strokeWidth={2.2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="wf-tour-chip">
                    {t("progress", { current: index + 1, total: steps.length })}
                  </span>
                  <div className="wf-tour-progress flex-1">
                    <div
                      className="wf-tour-progress-fill"
                      style={{ width: `${((index + 1) / steps.length) * 100}%` }}
                    />
                  </div>
                </div>
                <p className="wf-tour-title">{step.title}</p>
              </div>

              <button
                type="button"
                className="wf-tour-close"
                onClick={onClose}
                aria-label={t("skip")}
              >
                <X size={15} />
              </button>
            </div>

            <p className="wf-tour-body mt-2.5">{step.body}</p>

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {steps.map((dot, dotIndex) => (
                  <button
                    key={dot.id}
                    type="button"
                    onClick={() => setIndex(dotIndex)}
                    aria-label={t("progress", { current: dotIndex + 1, total: steps.length })}
                    aria-current={dotIndex === index}
                    className={
                      "wf-tour-dot" + (dotIndex === index ? " now" : dotIndex < index ? " done" : "")
                    }
                  />
                ))}
              </div>

              <div className="flex items-center gap-1">
                {index > 0 && (
                  <button type="button" className="wf-tour-btn" onClick={goBack}>
                    <Backward size={13} />
                    {t("back")}
                  </button>
                )}
                {!isLast && (
                  <button type="button" className="wf-tour-btn" onClick={onClose}>
                    {t("skip")}
                  </button>
                )}
                <button
                  type="button"
                  className="wf-tour-next"
                  onClick={() => (isLast ? onClose() : goNext())}
                >
                  {isLast ? t("done") : t("next")}
                  {isLast ? (
                    <Check size={14} strokeWidth={3} />
                  ) : (
                    <Forward size={14} strokeWidth={3} />
                  )}
                </button>
              </div>
            </div>

            <p className="wf-tour-hint mt-2.5 text-center">{t("keyboardHint")}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
