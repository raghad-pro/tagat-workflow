
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────
 export type SkeletonVariant = "table" | "cards" | "form" | "dashboard";

interface PageSkeletonProps {
  variant?: SkeletonVariant;
  rows?: number;
  className?: string;
}

// ─── Table Skeleton ────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-2xl ds-bg-form ds-border-form overflow-hidden" style={{ boxShadow: "var(--shadow-sm)" }}>
      {/* Filter bar */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--color-border-form)" }}>
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1 rounded-xl" />
          <Skeleton className="h-12 w-40 rounded-xl" />
          <Skeleton className="h-12 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table header */}
      <div className="px-4 py-3 hidden md:flex gap-4" style={{ borderBottom: "1px solid var(--color-border-form)", background: "var(--color-bg)" }}>
        {[120, 180, 90, 100, 90, 80].map((w, i) => (
          <Skeleton key={i} className="h-4 rounded-lg" style={{ width: w }} />
        ))}
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 flex items-center gap-4"
            style={{ borderBottom: i < rows - 1 ? "1px solid var(--color-border-form)" : "none" }}
          >
            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-4 rounded-lg w-40" />
              <Skeleton className="h-3 rounded-lg w-56" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full hidden md:block" />
            <Skeleton className="h-4 w-16 rounded-lg hidden md:block" />
            <Skeleton className="h-4 w-20 rounded-lg hidden md:block" />
            <Skeleton className="h-6 w-16 rounded-full hidden md:block" />
            <div className="flex gap-1 ms-auto">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="px-5 py-4 flex justify-end gap-1.5" style={{ borderTop: "1px solid var(--color-border-form)" }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="w-8 h-8 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

// ─── Cards Skeleton ────────────────────────────────────────────────────────────
function CardsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl ds-bg-form ds-border-form p-4 flex gap-3"
          style={{ boxShadow: "var(--shadow-sm)" }}
        >
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-4 rounded-lg w-3/4" />
            <Skeleton className="h-3 rounded-lg w-1/2" />
            <div className="flex gap-2 mt-1">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Form Skeleton ─────────────────────────────────────────────────────────────
function FormSkeleton() {
  return (
    <div className="rounded-2xl ds-bg-form ds-border-form p-6 flex flex-col gap-5" style={{ boxShadow: "var(--shadow-sm)" }}>
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-40 rounded-lg" />
          <Skeleton className="h-3 w-56 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-24 rounded-lg" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-12 w-32 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
      </div>
    </div>
  );
}

// ─── Dashboard Skeleton ────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl ds-bg-form ds-border-form px-5 py-4 flex items-center gap-4" style={{ boxShadow: "var(--shadow-sm)" }}>
            <Skeleton className="w-11 h-11 rounded-full shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1">
              <Skeleton className="h-5 w-16 rounded-lg" />
              <Skeleton className="h-3 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart */}
      <div className="rounded-2xl ds-bg-form ds-border-form p-5" style={{ boxShadow: "var(--shadow-sm)" }}>
        <Skeleton className="h-4 w-40 rounded-lg mb-4" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
      {/* Table preview */}
      <TableSkeleton rows={3} />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export function PageSkeleton({ variant = "table", rows, className }: PageSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-5 p-4 sm:p-6", className)}>
      {/* Page header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-52 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      {/* Content skeleton */}
      {variant === "table"     && <TableSkeleton rows={rows} />}
      {variant === "cards"     && <CardsSkeleton rows={rows} />}
      {variant === "form"      && <FormSkeleton />}
      {variant === "dashboard" && <DashboardSkeleton />}
    </div>
  );
}