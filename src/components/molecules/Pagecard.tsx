"use client";

import { cn } from "@/lib/utils";

interface PageCardProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

/**
 * The white rounded card that wraps the table + filters in every dashboard page.
 * Usage:
 *   <PageCard>
 *     <SearchFilterBar ... />
 *     <DataTable ... />
 *     <Pagination ... />
 *   </PageCard>
 */
export function PageCard({ children, className, noPadding }: PageCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl ds-bg-form ds-border-form overflow-hidden",
        className
      )}
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      {children}
    </div>
  );
}

/** Divider-separated section inside a PageCard */
export function PageCardSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-5 py-4", className)}
      style={{ borderBottom: "1px solid var(--color-border-form)" }}
    >
      {children}
    </div>
  );
}

/** Bottom section (table area) — no top border by default */
export function PageCardBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("px-5 py-2", className)}>{children}</div>;
}

/** Footer section (pagination) */
export function PageCardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("px-5 pb-5", className)}
      style={{ borderTop: "1px solid var(--color-border-form)" }}
    >
      {children}
    </div>
  );
}