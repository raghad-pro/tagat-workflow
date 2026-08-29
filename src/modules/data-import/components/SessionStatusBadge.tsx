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
const STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
  pending: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
  ready: { bg: "rgba(34,200,224,0.14)", color: "#0e9bb0" },
  processing: { bg: "rgba(245,158,11,0.14)", color: "#d97706" },
  committing: { bg: "rgba(245,158,11,0.14)", color: "#d97706" },
  committed: { bg: "rgba(16,185,129,0.14)", color: "#059669" },
  completed: { bg: "rgba(16,185,129,0.14)", color: "#059669" },
  failed: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
};

const NEUTRAL = { bg: "rgba(107,114,128,0.12)", color: "#6b7280" };

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
