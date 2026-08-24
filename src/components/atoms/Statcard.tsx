"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  icon: LucideIcon | React.ElementType;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  /** optional prefix shown before value, e.g. "$" or "+" */
  prefix?: string;
  className?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = "#25C6DA",
  iconBg = "rgba(37, 198, 218, 0.12)",
  prefix,
  className,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString("en-US") : value;

  const IconEl = Icon as any;

  return (
    <div
      className={cn(
        "ds-bg-form rounded-[8px] p-6 h-[145px] flex items-center shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)] hover:shadow-[0_6px_24px_0_rgba(0,0,0,0.09)] transition-all min-w-0 border border-slate-100 dark:border-slate-800",
        className
      )}
    >
      <div className="flex items-center gap-4 min-w-0 w-full">
        {/* Icon 48x48 rounded 8px matching Figma */}
        <div
          className="w-[48px] h-[48px] rounded-[8px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg }}
        >
          <IconEl size={24} style={{ color: iconColor }} />
        </div>

        {/* Text Container matching Figma typography */}
        <div className="flex flex-col min-w-0 justify-center">
          <span className="text-[13px] font-medium text-[#000000] dark:text-gray-300 truncate leading-[20px]">
            {label}
          </span>
          <span className="text-[30px] font-bold text-[#000000] dark:text-white leading-[36px] truncate tracking-tight">
            {prefix && <span className="text-[24px] me-1 font-semibold">{prefix}</span>}
            {displayValue}
          </span>
        </div>
      </div>
    </div>
  );
}
