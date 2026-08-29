"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The bordered panel every step is drawn inside.
 *
 * The step's action sits at the bottom of the body rather than in a divided
 * footer — one button, on the start edge, the way the design has it.
 */
export function WizardCard({
  title,
  description,
  children,
  actions,
  actionsAlign = "start",
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  actionsAlign?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border-form)] ds-bg-form",
        "shadow-[0_4px_20px_0_rgba(0,0,0,0.04)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.3)]"
      )}
    >
      <div className="flex flex-col gap-1 px-5 pt-6 sm:px-7">
        <h2 className="text-[19px] font-bold ds-text-main">{title}</h2>
        {description && (
          <p className="text-[14px] leading-relaxed text-slate-400 dark:text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="px-5 py-6 sm:px-7">{children}</div>

      {actions && (
        <div
          className={cn(
            "flex flex-wrap items-center gap-3 px-5 pb-6 sm:px-7",
            actionsAlign === "center" ? "justify-center" : "justify-start"
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/** The step has nothing to show yet — a quiet mark and one line saying why. */
export function WizardEmpty({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
  return (
    <div className="flex min-h-[230px] flex-col items-center justify-center gap-3 text-center">
      <Icon size={40} strokeWidth={1.25} className="text-slate-200 dark:text-slate-700" />
      <p className="text-[14px] text-slate-400 dark:text-slate-500">{message}</p>
    </div>
  );
}

export type WizardTone = "brand" | "green" | "amber" | "red" | "blue" | "slate";

/** One counted figure — the tiles the import and result steps are built from. */
export function WizardTile({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: WizardTone;
}) {
  const color: Record<WizardTone, string> = {
    brand: "text-[var(--color-btn-brand)]",
    green: "text-emerald-500",
    amber: "text-amber-500",
    red: "text-red-500",
    blue: "text-blue-500",
    slate: "ds-text-main",
  };

  return (
    <div className="flex min-w-[120px] flex-1 flex-col items-center gap-1.5 rounded-xl border border-[var(--color-border-form)] px-3 py-4 text-center">
      <span className={cn("text-[26px] font-bold leading-none", color[tone])}>
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </span>
      <span className="text-[12px] leading-snug text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}

/** A small labelled figure — "12 rows", "4 columns". */
export function WizardStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[12px] text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-[14px] font-bold ds-text-main">{value}</span>
    </div>
  );
}

/** Native select, dressed to match the form controls elsewhere. */
export const SELECT_CLASS = cn(
  "h-9 w-full cursor-pointer rounded-lg px-2 text-[13px] ds-text-main",
  "border border-[var(--color-border-form)] bg-transparent outline-none",
  "transition-colors focus:border-[var(--color-btn-brand)]",
  "[&>option]:bg-[var(--color-bg-form)] [&>option]:text-[color:var(--color-text-primary)]"
);
