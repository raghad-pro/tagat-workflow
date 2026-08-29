"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { KPI_CARD, toneEdge, toneInk, toneWash, type KpiTone } from "../tones";
import type { KpiMetric } from "../types/kpis.types";

interface KpiMetricCardProps {
  label: string;
  metric?: KpiMetric<number | string>;
  valueOverride?: string | number;
  icon: LucideIcon;
  /** Which accent this figure belongs to. See `../tones`. */
  tone?: KpiTone;
  prefix?: string;
  suffix?: string;
  subLabel?: string;
  className?: string;
}

/** Up is not always good — spending more is a worse month, not a better one. */
const TREND_TONE: Record<"up" | "down" | "neutral", KpiTone> = {
  up: "green",
  down: "red",
  neutral: "slate",
};

export function KpiMetricCard({
  label,
  metric,
  valueOverride,
  icon: Icon,
  tone = "sky",
  prefix,
  suffix,
  subLabel,
  className,
}: KpiMetricCardProps) {
  const t = useTranslations("kpis");

  const rawValue = valueOverride !== undefined ? valueOverride : metric?.value ?? 0;
  const displayValue =
    typeof rawValue === "number" ? rawValue.toLocaleString("en-US") : rawValue;

  const change = metric?.change_percentage;
  const trend = metric?.trend ?? "neutral";
  const hasChange = change !== null && change !== undefined;
  const trendTone = TREND_TONE[trend];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        KPI_CARD,
        "group relative flex h-[145px] items-center overflow-hidden p-5 min-w-0",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_16px_38px_-18px_rgba(15,23,42,0.28)]",
        className
      )}
    >
      {/* A sliver of the tone down the leading edge. It is what tells four
          otherwise identical cards apart at a glance. */}
      <span
        aria-hidden
        className="absolute inset-y-0 start-0 w-[3px]"
        style={{ backgroundColor: toneWash(tone, 55) }}
      />

      <div className="flex w-full min-w-0 items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
          style={{
            color: toneInk(tone),
            backgroundColor: toneWash(tone),
            border: `1px solid ${toneEdge(tone)}`,
          }}
        >
          <Icon size={22} strokeWidth={2.1} />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[13px] font-medium leading-5 ds-text-gray-100">
              {label}
            </span>

            {hasChange && (
              <span
                className="inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{
                  color: toneInk(trendTone),
                  backgroundColor: toneWash(trendTone, 15),
                }}
              >
                <TrendIcon size={11} strokeWidth={2.6} />
                <span>{change > 0 ? `+${change}%` : `${change}%`}</span>
              </span>
            )}
          </div>

          <div className="mt-0.5 flex items-baseline gap-1">
            <span className="truncate text-[30px] font-bold leading-9 tracking-tight ds-text-primary">
              {prefix && <span className="me-1 text-[22px] font-semibold">{prefix}</span>}
              {displayValue}
              {suffix && (
                <span className="ms-1 text-[14px] font-medium ds-text-gray-200">{suffix}</span>
              )}
            </span>
          </div>

          <div className="mt-0.5 truncate text-[11px] ds-text-gray-200">
            {subLabel ? (
              <span>{subLabel}</span>
            ) : metric?.previous !== null && metric?.previous !== undefined ? (
              <span>
                {t("previous", {
                  value:
                    typeof metric.previous === "number"
                      ? metric.previous.toLocaleString("en-US")
                      : String(metric.previous),
                })}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
