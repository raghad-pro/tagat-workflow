"use client";

import type { GenericStatus } from "@/types/Shared.types";

// ─── StatusBadge ──────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: GenericStatus;
  label?: string;
  /** show a dot indicator before the label (default: false) */
  withDot?: boolean;
}

const STATUS_CONFIG: Record<
  GenericStatus,
  { label: string; bg: string; color: string; dot: string }
> = {
  active:      { label: "Active",       bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  pending:     { label: "Pending",      bg: "rgba(245,158,11,0.12)", color: "#d97706", dot: "#f59e0b" },
  suspended:   { label: "Suspended",    bg: "rgba(239,68,68,0.10)",  color: "#dc2626", dot: "#ef4444" },
  in_progress: { label: "In Progress",  bg: "rgba(59,130,246,0.12)", color: "#1d4ed8", dot: "#3b82f6" },
  completed:   { label: "Completed",    bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  rejected:    { label: "Rejected",     bg: "rgba(239,68,68,0.10)",  color: "#dc2626", dot: "#ef4444" },
  new_request: { label: "New Request",  bg: "rgba(245,158,11,0.12)", color: "#b45309", dot: "#f59e0b" },
  failed:      { label: "Failed",       bg: "rgba(239,68,68,0.10)",  color: "#dc2626", dot: "#ef4444" },
  success:     { label: "Success",      bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  processing:  { label: "Processing",   bg: "rgba(245,158,11,0.12)", color: "#d97706", dot: "#f59e0b" },
  approved:    { label: "Approved",     bg: "rgba(16,185,129,0.12)", color: "#059669", dot: "#10b981" },
  cancelled:   { label: "Cancelled",    bg: "rgba(107,114,128,0.10)", color: "#6b7280", dot: "#9ca3af" },
  onboarding:  { label: "Onboarding",   bg: "rgba(59,130,246,0.12)", color: "#1d4ed8", dot: "#3b82f6" },
  inactive:    { label: "Inactive",     bg: "rgba(107,114,128,0.10)", color: "#6b7280", dot: "#9ca3af" },
};

export function StatusBadge({ status, label, withDot = true }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as GenericStatus] || {
    label: status || "Unknown",
    bg: "rgba(107,114,128,0.10)",
    color: "#4b5563",
    dot: "#9ca3af",
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {withDot && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: cfg.dot }}
        />
      )}
      {label ?? cfg.label}
    </span>
  );
}

// ─── PriorityBadge ────────────────────────────────────────────────────────────

export type Priority = "High" | "Medium" | "Low";

const PRIORITY_CONFIG: Record<Priority, { bg: string; color: string }> = {
  High:   { bg: "#fff1f2", color: "#be123c" },
  Medium: { bg: "#fff7ed", color: "#c2410c" },
  Low:    { bg: "#f0fdf4", color: "#15803d" },
};

interface PriorityBadgeProps {
  priority: Priority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full ds-text-sm ds-font-medium whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {priority}
    </span>
  );
}