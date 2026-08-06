"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import {
  daysRemaining,
  isSprintActive,
  isSprintCompleted,
  type Sprint,
} from "../types/sprints.types";

const DOT: Record<string, string> = {
  active: "bg-[var(--color-status-approved)]",
  completed: "bg-slate-400",
  planned: "bg-slate-300 dark:bg-slate-600",
};

const BADGE: Record<string, string> = {
  active: "bg-[var(--color-status-approved-bg)] text-[var(--color-status-approved)]",
  completed: "bg-[var(--color-status-approved-bg)] text-[var(--color-status-approved)]",
  planned: "bg-[var(--color-bg)] ds-text-gray-200",
};

interface SprintRowProps {
  sprint: Sprint;
  /** True when some other sprint of this project is already running. */
  hasActiveSprint: boolean;
  onStart: (sprint: Sprint) => void;
  onComplete: (sprint: Sprint) => void;
  canEdit: boolean;
  isBusy?: boolean;
}

export function SprintRow({
  sprint,
  hasActiveSprint,
  onStart,
  onComplete,
  canEdit,
  isBusy,
}: SprintRowProps) {
  const t = useTranslations("sprint");

  const active = isSprintActive(sprint);
  const closed = isSprintCompleted(sprint);
  const key = closed ? "completed" : active ? "active" : "planned";
  const taskCount = (sprint.tasks ?? []).length;
  const remaining = active ? daysRemaining(sprint) : null;

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-2xl ds-bg-form px-5 py-4"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", DOT[key])} />

      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-bold ds-text-primary truncate">{sprint.name}</p>
        {sprint.goal && (
          <p className="mt-0.5 text-[12px] ds-text-gray-200 truncate">{sprint.goal}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className={cn("rounded-md px-2.5 py-1 text-[11px] font-semibold", BADGE[key])}>
          {t(`sprintStatus.${key}`)}
        </span>

        <span className="text-[12px] ds-text-gray-200 whitespace-nowrap">
          {t("taskCount", { count: taskCount })}
        </span>

        <span className="text-[12px] ds-text-gray-200 whitespace-nowrap">
          {sprint.start_date} → {sprint.end_date}
        </span>

        {remaining !== null && (
          <span
            className={cn(
              "text-[12px] font-bold whitespace-nowrap",
              remaining < 0 ? "text-[var(--color-status-rejected)]" : "ds-text-brand"
            )}
          >
            {remaining < 0
              ? t("overdueBy", { days: Math.abs(remaining) })
              : t("daysLeft", { days: remaining })}
          </span>
        )}

        {/* The mockup shows no lifecycle controls, but a sprint that cannot be
            started or closed is only a label — so they live here, kept quiet. */}
        {canEdit && !closed && (
          active ? (
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => onComplete(sprint)}
              licon={<CheckCircle2 size={14} />}
            >
              {t("completeSprint")}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy || hasActiveSprint}
              title={hasActiveSprint ? t("alreadyActive") : undefined}
              onClick={() => onStart(sprint)}
              licon={<Play size={14} />}
            >
              {t("startSprint")}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
