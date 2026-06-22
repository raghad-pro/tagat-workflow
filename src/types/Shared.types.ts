import { LucideIcon } from "lucide-react";

// ─── Status ───────────────────────────────────────────────────────────────────
export type GenericStatus =
  | "active"
  | "pending"
  | "suspended"
  | "in_progress"
  | "completed"
  | "rejected"
  | "new_request"
  | "failed"
  | "success"
  | "processing";

// ─── Stat Card ────────────────────────────────────────────────────────────────
export interface StatCardData {
  icon: LucideIcon;
  value: string | number;
  label: string;
  iconColor?: string;
  iconBg?: string;
  prefix?: string;   // e.g. "$", "+"
}

// ─── Table ────────────────────────────────────────────────────────────────────
export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export interface PageHeaderAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "solid" | "outline" | "ghost";
}

// ─── Filter ───────────────────────────────────────────────────────────────────
export interface FilterOption {
  value: string;
  label: string;
}