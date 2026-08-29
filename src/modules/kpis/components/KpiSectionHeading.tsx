"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { toneEdge, toneInk, toneWash, type KpiTone } from "../tones";

interface KpiSectionHeadingProps {
  icon: LucideIcon;
  title: string;
  tone: KpiTone;
}

/**
 * The rule-and-badge that opens each KPI section.
 *
 * It was written out three times with three sets of hardcoded pastels, which
 * is how the sections ended up at slightly different weights. The hairline
 * carries the eye across to the next section rather than leaving the heading
 * floating over the grid.
 */
export function KpiSectionHeading({ icon: Icon, title, tone }: KpiSectionHeadingProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{
          color: toneInk(tone),
          backgroundColor: toneWash(tone),
          border: `1px solid ${toneEdge(tone)}`,
        }}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </div>

      <h2 className="text-[19px] font-bold leading-8 tracking-tight ds-text-primary sm:text-[21px]">
        {title}
      </h2>

      {/* Flat rather than a fade: a gradient would need a direction, and this
          page is read both ways round. */}
      <span
        aria-hidden
        className="h-px flex-1"
        style={{ backgroundColor: "color-mix(in srgb, var(--color-text-primary) 10%, transparent)" }}
      />
    </div>
  );
}
