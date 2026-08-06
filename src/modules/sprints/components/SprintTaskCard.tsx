"use client";

import { useTranslations } from "next-intl";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Clock, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { boardStatusOf, storyPointsOf, type SprintTask } from "../types/sprints.types";

const PRIORITY_STYLE: Record<string, string> = {
  urgent: "bg-[var(--color-status-rejected-bg)] text-[var(--color-status-rejected)]",
  high: "bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending)]",
  medium: "bg-[var(--color-bg-primary-200)] text-[var(--color-text-brand)]",
  low: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

function initialsOf(name?: string | null) {
  return (name || "?")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface SprintTaskCardProps {
  task: SprintTask;
  /** Set while this card is the one rendered inside the drag overlay. */
  isOverlay?: boolean;
  onClick?: (task: SprintTask) => void;
  disabled?: boolean;
}

export function SprintTaskCard({ task, isOverlay, onClick, disabled }: SprintTaskCardProps) {
  const t = useTranslations("sprint");
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { type: "task", task },
    disabled,
  });

  const points = storyPointsOf(task);
  // next-intl throws on a missing key rather than returning the key, so an
  // unrecognised priority has to be mapped to a known one before lookup.
  const rawPriority = String(task.priority ?? "medium");
  const priority = rawPriority in PRIORITY_STYLE ? rawPriority : "medium";
  const status = boardStatusOf(task);
  const assignee = task.assigned_user;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group rounded-xl border ds-border-form ds-bg-form p-3 flex flex-col gap-2",
        // The original stays in place as a placeholder while the overlay follows
        // the cursor — hiding it entirely would collapse the column mid-drag.
        isDragging && !isOverlay && "opacity-40",
        isOverlay && "shadow-2xl rotate-1 cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className={cn(
            "shrink-0 mt-0.5 ds-text-gray-200 touch-none",
            disabled ? "cursor-not-allowed opacity-40" : "cursor-grab active:cursor-grabbing"
          )}
          aria-label={t("dragHandle")}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={15} />
        </button>

        <button
          type="button"
          onClick={() => onClick?.(task)}
          className="min-w-0 flex-1 text-start"
        >
          <p className="text-[13px] font-semibold ds-text-primary line-clamp-2">
            {task.title}
          </p>
        </button>

        {points > 0 && (
          <span
            className="shrink-0 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--color-bg-primary-200)] px-1.5 text-[11px] font-bold text-[var(--color-text-brand)]"
            title={t("storyPoints")}
          >
            {points}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 ps-6">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[10px] font-bold",
              PRIORITY_STYLE[priority] ?? PRIORITY_STYLE.medium
            )}
          >
            {t(`priority.${priority}`)}
          </span>
          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {t(`status.${status}`)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {task.duration ? (
            <span className="flex items-center gap-1 text-[10px] ds-text-gray-200">
              <Clock size={11} />
              {(Number(task.duration) / 60).toFixed(1)}
            </span>
          ) : null}
          {assignee && (
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-bg-primary)] text-[9px] font-bold text-white"
              title={assignee.name ?? ""}
            >
              {initialsOf(assignee.name)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
