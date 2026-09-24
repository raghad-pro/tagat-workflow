"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * The small pieces the three Project AI panels share. Colours follow the
 * data-import pills so the two AI-adjacent screens read as one family.
 */

export type Tone = "neutral" | "busy" | "ready" | "done" | "bad" | "warn";

const TONES: Record<Tone, { bg: string; color: string }> = {
  neutral: { bg: "rgba(107,114,128,0.12)", color: "#6b7280" },
  busy: { bg: "rgba(245,158,11,0.14)", color: "#d97706" },
  ready: { bg: "rgba(34,200,224,0.14)", color: "#0e9bb0" },
  done: { bg: "rgba(16,185,129,0.14)", color: "#059669" },
  bad: { bg: "rgba(239,68,68,0.12)", color: "#dc2626" },
  warn: { bg: "rgba(249,115,22,0.14)", color: "#ea580c" },
};

const STATUS_TONES: Record<string, Tone> = {
  // plans
  draft: "neutral",
  pending: "busy",
  generating: "busy",
  processing: "busy",
  suggested: "ready",
  generated: "ready",
  reviewed: "ready",
  in_review: "ready",
  approved: "done",
  failed: "bad",
  rejected: "bad",
  // documents
  uploaded: "ready",
  processed: "done",
  extracted: "done",
  // alerts
  open: "warn",
  acknowledged: "ready",
  resolved: "done",
};

const SEVERITY_TONES: Record<string, Tone> = {
  low: "neutral",
  medium: "busy",
  high: "warn",
  critical: "bad",
  urgent: "bad",
};

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const style = TONES[tone];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-[3px] text-[12px] font-semibold whitespace-nowrap"
      style={{ background: style.bg, color: style.color }}
    >
      {children}
    </span>
  );
}

/**
 * A status or severity, translated when the UI has a word for it and shown
 * verbatim when the server invents one.
 */
export function StatusPill({
  value,
  kind = "status",
}: {
  value: string;
  kind?: "status" | "severity" | "priority";
}) {
  const t = useTranslations("projectAi");
  const key = (value || "").toLowerCase();
  if (!key) return null;

  const tone = (kind === "status" ? STATUS_TONES[key] : SEVERITY_TONES[key]) ?? "neutral";
  const path = `${kind === "status" ? "status" : kind === "severity" ? "severity" : "priority"}.${key}`;

  let label = key.replace(/_/g, " ");
  if (t.has(path as Parameters<typeof t.has>[0])) label = t(path as Parameters<typeof t>[0]);

  return <Pill tone={tone}>{label}</Pill>;
}

/** The bordered card each panel is drawn inside. */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl ds-bg-form overflow-hidden",
        "shadow-[0_4px_20px_0_rgba(0,0,0,0.06)] dark:shadow-[0_4px_20px_0_rgba(0,0,0,0.35)]",
        className
      )}
    >
      <div
        className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        style={{ borderBottom: "1px solid var(--color-border-form)" }}
      >
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-[16px] font-bold ds-text-main">{title}</h2>
          {description && (
            <p className="max-w-2xl text-[13px] leading-relaxed text-slate-400 dark:text-slate-500">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </section>
  );
}

export function Empty({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[var(--color-btn-brand)]/10">
        <Icon size={22} className="text-[var(--color-btn-brand)]" />
      </div>
      <p className="text-[15px] font-bold ds-text-main">{title}</p>
      {description && (
        <p className="max-w-sm text-[13px] text-slate-400 dark:text-slate-500">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** A panel's own loading / failure line — the page around it stays usable. */
export function PanelState({
  isLoading,
  error,
  onRetry,
}: {
  isLoading: boolean;
  error?: unknown;
  onRetry?: () => void;
}) {
  const t = useTranslations("projectAi");
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-6 sm:px-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/60" />
        ))}
      </div>
    );
  }
  const message = (error as { message?: string } | undefined)?.message || t("loadFailed");
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="max-w-md text-[13px] text-red-500">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer text-[13px] font-semibold text-[var(--color-btn-brand)] hover:underline"
        >
          {t("retry")}
        </button>
      )}
    </div>
  );
}

/** Native select / input, dressed to match the form controls elsewhere. */
export const FIELD_CLASS = cn(
  "h-9 w-full rounded-lg px-2.5 text-[13px] ds-text-main",
  "border border-[var(--color-border-form)] bg-transparent outline-none",
  "transition-colors focus:border-[var(--color-btn-brand)] disabled:opacity-60",
  "[&>option]:bg-[var(--color-bg-form)] [&>option]:text-[color:var(--color-text-primary)]"
);
