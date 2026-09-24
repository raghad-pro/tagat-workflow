"use client";

import { useTranslations } from "next-intl";

/**
 * The session pill.
 *
 * `StatusBadge` has no `draft`, and its fallback paints a dot the design does
 * not have — so this screen carries its own small map. The status vocabulary is
 * the server's, so an unknown one is shown verbatim in the neutral style rather
 * than swallowed.
 */
const NEUTRAL = { bg: "rgba(107,114,128,0.12)", color: "#6b7280" };
const BUSY = { bg: "rgba(245,158,11,0.14)", color: "#d97706" };
const READY = { bg: "rgba(34,200,224,0.14)", color: "#0e9bb0" };
const DONE = { bg: "rgba(16,185,129,0.14)", color: "#059669" };
const BAD = { bg: "rgba(239,68,68,0.12)", color: "#dc2626" };

/** The history route's vocabulary first, then what a committed session reports. */
const STYLES: Record<string, { bg: string; color: string }> = {
  draft: NEUTRAL,
  uploading: BUSY,
  uploaded: READY,
  parsing: BUSY,
  parsed: READY,
  failed: BAD,
  cancelled: NEUTRAL,
  pending: NEUTRAL,
  ready: READY,
  processing: BUSY,
  committing: BUSY,
  committed: DONE,
  completed: DONE,
};

export function SessionStatusBadge({ status }: { status: string }) {
  const t = useTranslations("dataImport");
  const key = (status || "draft").toLowerCase();
  const style = STYLES[key] ?? NEUTRAL;

  // A status the UI has a word for is translated; anything else the server
  // invents is shown as it came.
  let label = key;
  try {
    const translated = t(`status.${key}` as Parameters<typeof t>[0]);
    if (translated && !translated.startsWith("dataImport.")) label = translated;
  } catch {
    /* falls through to the raw status */
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {label}
    </span>
  );
}
