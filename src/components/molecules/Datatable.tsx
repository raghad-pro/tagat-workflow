"use client";

import React from "react";
import { Inbox } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { Pagination } from "./Pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  header: string;
  width?: string;
  render?: (row: T) => React.ReactNode;
  hideOnMobile?: boolean;
  isPrimary?: boolean;
}


export interface TableAction<T = Record<string, unknown>> {
  icon: React.ElementType<any>;
  label?: string;
  colorScheme?: "send" | "edit" | "delete";
  onClick: (row: T) => void;
  hidden?: (row: T) => boolean;
  disabled?: (row: T) => boolean; 
  iconColor?:string;
  hoverBg?:string;
}

interface DataTableProps<T extends { id: number | string }> {
  columns: TableColumn<T>[];
  data: T[];
  actions?: TableAction<T>[];
  actionsHeader?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  pagination?: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    icon?: React.ElementType;
  };
}

// ─── Color scheme map → ds-action-* utilities ─────────────────────────────────
const schemeClass: Record<string, string> = {
  send:   "ds-action-send",
  edit:   "ds-action-edit",
  delete: "ds-action-delete",
};

// ─── Action Icon Button — يستخدم Button atom بـ size="icon" ──────────────────
function ActionIconBtn<T>({
  action,
  row,
}: {
  action: TableAction<T>;
  row: T;
}) {
  if (action.hidden?.(row)) return null;

  const Icon = action.icon as any;
  const scheme = action.colorScheme ?? "send";
   const isDisabled = action.disabled?.(row) ?? false;

  return (
    <button
      title={action.label}
      aria-label={action.label}
        onClick={() => !isDisabled && action.onClick(row)}
        disabled={isDisabled}                               
      className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-all hover:opacity-80 focus:outline-none",
         isDisabled
          ? "opacity-30 cursor-not-allowed"        
          : "hover:opacity-80",
        schemeClass[scheme]
      )}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}

// ─── Loading Skeleton ──────────────────────────────────────────────────────────
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div
            className="h-4 rounded-lg animate-pulse w-3/4"
            style={{ background: "var(--color-gray-300)" }}
          />
        </td>
      ))}
    </tr>
  );
}

// ─── Desktop Table ─────────────────────────────────────────────────────────────
function DesktopTable<T extends { id: number | string }>({
  columns,
  data,
  actions,
  actionsHeader = "Actions",
  isLoading,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const defaultActionsHeader = t("actions");
  const defaultEmptyMessage = t("noDataFound");
  const finalActionsHeader = actionsHeader ?? defaultActionsHeader;
  const finalEmptyMessage = emptyMessage ?? defaultEmptyMessage;

  const hasActions = !!actions?.length;
  const totalCols = columns.length + (hasActions ? 1 : 0);

  return (
    <div className="hidden md:block overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <table className="w-full border-collapse">

        {/* ── Head ── */}
        <thead>
          <tr style={{ borderBottom: "1px solid var(--color-border-form)" }}>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-start px-4 py-3 ds-text-sm ds-font-medium ds-text-gray-200 whitespace-nowrap"
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
            {hasActions && (
              <th className="text-start px-4 py-3 ds-text-sm ds-font-medium ds-text-gray-200 whitespace-nowrap">
                {finalActionsHeader}
              </th>
            )}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={i} cols={totalCols} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={totalCols} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Inbox size={32} className="ds-text-gray-200" />
                  <Text color="gray-200" size="sm" tag="p">
                    {finalEmptyMessage}
                  </Text>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                className="transition-colors hover:ds-bg-primary-200"
                style={{ borderBottom: "1px solid var(--color-border-form)" }}
              >
                {/* Data cells */}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 ds-text-sm ds-text-primary">
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "—")}
                  </td>
                ))}

                {/* Actions cell */}
                {hasActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {actions!.map((action, i) => (
                        <ActionIconBtn key={i} action={action} row={row} />
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Mobile Cards ─────────────────────────────────────────────────────────────
function MobileCards<T extends { id: number | string }>({
  columns,
  data,
  actions,
  emptyMessage,
}: DataTableProps<T>) {
  const t = useTranslations("common");
  const defaultEmptyMessage = t("noDataFound");
  const finalEmptyMessage = emptyMessage ?? defaultEmptyMessage;

  const primaryCol = columns.find((c) => c.isPrimary) ?? columns[0];
  const restCols = columns.filter(
    (c) => c.key !== primaryCol.key && !c.hideOnMobile
  );
  const hasActions = !!actions?.length;

  if (data.length === 0) {
    return (
      <div className="md:hidden py-12 text-center">
        <Inbox size={32} className="ds-text-gray-200 mx-auto" />
        <Text color="gray-200" size="sm" tag="p" className="mt-2">
          {finalEmptyMessage}
        </Text>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 md:hidden">
      {data.map((row) => (
        <div
          key={row.id}
          className="rounded-xl ds-bg-form ds-border-form p-4 ds-shadow-sm"
        >
          {/* Primary field */}
          <div className="mb-3 ds-text-sm ds-text-primary font-semibold">
            {primaryCol.render
              ? primaryCol.render(row)
              : String((row as Record<string, unknown>)[primaryCol.key] ?? "—")}
          </div>

          {/* Label : Value rows — label on start, value on end (auto-flips RTL/LTR) */}
          <div
            className="flex flex-col gap-2.5 pt-3"
            style={{ borderTop: "1px solid var(--color-border-form)" }}
          >
            {restCols.map((col) => (
              <div
                key={col.key}
                className="flex items-center justify-between gap-3"
              >
                {/* Label — start side */}
                <span className="shrink-0 text-[11px] font-medium ds-text-gray-200 whitespace-nowrap">
                  {col.header}
                </span>

                {/* Value — end side */}
                <div className="ds-text-sm ds-text-primary text-end min-w-0">
                  {col.render
                    ? col.render(row)
                    : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </div>
              </div>
            ))}
          </div>

          {/* Actions row */}
          {hasActions && (
            <div
              className="flex items-center gap-2 pt-3 mt-3"
              style={{ borderTop: "1px solid var(--color-border-form)" }}
            >
              {actions!.map((action, i) => (
                <ActionIconBtn key={i} action={action} row={row} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export function DataTable<T extends { id: number | string }>({
  pagination,
  ...props
}: DataTableProps<T>) {
  const displayData = React.useMemo(() => {
    if (!pagination || props.data.length <= pagination.pageSize) {
      return props.data;
    }
    const start = (pagination.currentPage - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return props.data.slice(start, end);
  }, [props.data, pagination]);

  return (
    <div className="flex flex-col w-full">
      <DesktopTable {...props} data={displayData} />
      <MobileCards {...props} data={displayData} />
      {pagination && (pagination.totalItems > pagination.pageSize || pagination.currentPage > 1) && (
        <Pagination
          currentPage={pagination.currentPage}
          data={Array(pagination.totalItems).fill(0)}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}