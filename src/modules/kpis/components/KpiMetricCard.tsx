"use client";

import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "../types/kpis.types";

interface KpiMetricCardProps {
  label: string;
  metric?: KpiMetric<number | string>;
  valueOverride?: string | number;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  prefix?: string;
  suffix?: string;
  subLabel?: string;
  className?: string;
}

export function KpiMetricCard({
  label,
  metric,
  valueOverride,
  icon: Icon,
  iconBg = "#E6F6FE",
  iconColor = "#03A9F4",
  prefix,
  suffix,
  subLabel,
  className,
}: KpiMetricCardProps) {
  const rawValue = valueOverride !== undefined ? valueOverride : metric?.value ?? 0;
  const displayValue =
    typeof rawValue === "number" ? rawValue.toLocaleString("en-US") : rawValue;

  const change = metric?.change_percentage;
  const trend = metric?.trend ?? "neutral";
  const hasChange = change !== null && change !== undefined;

  return (
    <div
      className={cn(
        "ds-bg-form border border-slate-100 dark:border-slate-800 rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all min-w-0",
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0 w-full">
        {/* 48x48 rounded 8px Icon */}
        <div
          className="w-[48px] h-[48px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          {(() => {
            const IconEl = Icon as any;
            return <IconEl size={24} style={{ color: iconColor }} />;
          })()}
        </div>

        {/* Text Details */}
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300 truncate leading-[20px]">
              {label}
            </span>

            {/* Trend Indicator */}
            {hasChange && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                  trend === "up" && "bg-[#EDF7EE] text-[#4CAF50]",
                  trend === "down" && "bg-[#FEECEB] text-[#F44336]",
                  trend === "neutral" && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                )}
              >
                {trend === "up" && <TrendingUp size={11} />}
                {trend === "down" && <TrendingDown size={11} />}
                {trend === "neutral" && <Minus size={11} />}
                <span>
                  {change > 0 ? `+${change}%` : `${change}%`}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px] truncate tracking-tight">
              {prefix && <span className="text-[22px] me-1 font-semibold">{prefix}</span>}
              {displayValue}
              {suffix && <span className="text-[14px] ms-1 font-medium text-gray-500">{suffix}</span>}
            </span>
          </div>

          {/* Sub Label / Comparison text */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#707070] dark:text-gray-400 truncate mt-0.5">
            {subLabel ? (
              <span>{subLabel}</span>
            ) : metric?.previous !== null && metric?.previous !== undefined ? (
              <span>
                Prev: {typeof metric.previous === "number" ? metric.previous.toLocaleString("en-US") : metric.previous}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
