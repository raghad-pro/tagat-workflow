"use client";

import { LucideIcon } from "lucide-react";
import { Text } from "@/components/atoms/Text";

interface StatCardProps {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  /** optional prefix shown before value, e.g. "$" or "+" */
  prefix?: string;
}

export function StatCard({
  icon: Icon,
  value,
  label,
  iconColor = "var(--color-primary)",
  iconBg = "var(--color-bg-primary-200)",
  prefix,
}: StatCardProps) {
  const displayValue =
    typeof value === "number" ? value.toLocaleString('en-US') : value;

  return (
    <div
      className="flex items-center gap-3 sm:gap-4 rounded-2xl px-3 sm:px-5 py-3 sm:py-4 ds-bg-form ds-border-form flex-1 min-w-0"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <Icon size={18} className="sm:w-5 sm:h-5" style={{ color: iconColor }} />
      </div>

      {/* Text */}
      <div className="flex flex-col min-w-0">
        <Text size="lg" weight="bold" tag="p" className="leading-none truncate text-[16px] sm:text-[18px]">
          {prefix && (
            <span style={{ color: iconColor }} className="me-0.5">
              {prefix}
            </span>
          )}
          {displayValue}
        </Text>
        <Text size="sm" color="gray-200" tag="p" className="mt-0.5 truncate text-[11px] sm:text-[13px]">
          {label}
        </Text>
      </div>
    </div>
  );
}
