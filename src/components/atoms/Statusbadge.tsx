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
  active:      { label: "Active",       bg: "var(--color-status-active-bg, #EDF7EE)",  color: "var(--color-status-active, #4CAF50)", dot: "var(--color-status-active, #4CAF50)" },
  pending:     { label: "Pending",      bg: "var(--color-status-pending-bg, #FFFDEB)", color: "var(--color-status-pending, #E8D636)", dot: "var(--color-status-pending, #E8D636)" },
  suspended:   { label: "Suspended",    bg: "rgba(239,68,68,0.10)",   color: "var(--color-error)",   dot: "#ef4444"              },
  in_progress: { label: "In Progress",  bg: "rgba(59,130,246,0.10)",  color: "#1d4ed8",              dot: "#3b82f6"              },
  completed:   { label: "Completed",    bg: "rgba(34,197,94,0.10)",   color: "#15803d",              dot: "#22c55e"              },
  rejected:    { label: "Rejected",     bg: "rgba(239,68,68,0.10)",   color: "var(--color-error)",   dot: "#ef4444"              },
  new_request: { label: "New Request",  bg: "rgba(245,158,11,0.10)",  color: "#b45309",              dot: "#f59e0b"              },
  failed:      { label: "Failed",       bg: "rgba(239,68,68,0.10)",   color: "var(--color-error)",   dot: "#ef4444"              },
  success:     { label: "Success",      bg: "rgba(52,211,153,0.12)",  color: "#059669",              dot: "#34d399"              },
  processing:  { label: "Processing",   bg: "rgba(251,191,36,0.12)",  color: "#d97706",              dot: "#f59e0b"              },
  approved:    { label: "Approved",     bg: "rgba(34,197,94,0.10)",   color: "#15803d",              dot: "#22c55e"              },
  cancelled:   { label: "Cancelled",    bg: "rgba(107,114,128,0.10)", color: "#6b7280",              dot: "#9ca3af"              },
};

export function StatusBadge({ status, label, withDot = false }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status as GenericStatus] || {
    label: status || "Unknown",
    bg: "#f3f4f6", // default gray bg
    color: "#4b5563", // default gray color
    dot: "#9ca3af", // default gray dot
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ds-text-sm ds-font-medium whitespace-nowrap"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {withDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
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