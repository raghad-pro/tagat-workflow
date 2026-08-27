"use client";

import { useTranslations } from "next-intl";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";
import {
  boardStatusOf,
  isSprintCompleted,
  storyPointsOf,
  type Sprint,
  type SprintTask,
} from "../types/sprints.types";

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-[var(--color-status-rejected)]",
  high: "bg-orange-500",
  medium: "bg-amber-400",
  low: "bg-slate-400",
};

/** Stable per-name colour, so the same person keeps the same avatar. */
const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
  "bg-amber-500",
];

function avatarFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface BacklogTableProps {
  tasks: SprintTask[];
  sprints: Sprint[];
  onMoveToSprint: (taskId: number, sprintId: number | null) => void;
  onAddTask: () => void;
  canEdit: boolean;
  /** Pagination is client-side: the endpoint returns the whole backlog at once. */
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function BacklogTable({
  tasks,
  sprints,
  onMoveToSprint,
  onAddTask,
  canEdit,
  page,
  pageSize,
  onPageChange,
}: BacklogTableProps) {
  const t = useTranslations("sprint");

  const pageCount = Math.max(1, Math.ceil(tasks.length / pageSize));
  const current = Math.min(page, pageCount);
  const rows = tasks.slice((current - 1) * pageSize, current * pageSize);

  // A finished sprint is history — offering it as a destination would let new
  // work be filed under a sprint that already reported its result.
  const sprintOptions = sprints.filter((sprint) => !isSprintCompleted(sprint));

  return (
    <div
      data-tour="table"
      className="rounded-2xl ds-bg-form overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-2">
          <ClipboardList size={19} className="text-[var(--color-text-brand)]" />
          <h2 className="text-[17px] font-bold ds-text-primary">{t("productBacklog")}</h2>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-[var(--color-bg-primary-200)] px-1.5 text-[11px] font-bold text-[var(--color-text-brand)]">
            {tasks.length}
          </span>
        </div>

        {canEdit && (
          <Button variant="outline" size="sm" onClick={onAddTask} licon={<Plus size={15} />}>
            {t("addBacklogTask")}
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse">
          <thead>
            <tr className="bg-[var(--color-bg)]">
              {[
                t("table.title"),
                t("table.assignee"),
                t("table.storyPoints"),
                t("table.priority"),
                t("table.status"),
                t("table.moveToSprint"),
              ].map((header) => (
                <th
                  key={header}
                  className="px-5 py-3 text-center text-[12px] font-semibold ds-text-gray-200 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-[13px] ds-text-gray-200">
                  {t("emptyBacklog")}
                </td>
              </tr>
            ) : (
              rows.map((task) => {
                const name = task.assigned_user?.name ?? t("unassigned");
                const priority = String(task.priority ?? "medium");
                const priorityKey = priority in PRIORITY_DOT ? priority : "medium";

                return (
                  <tr
                    key={task.id}
                    className="border-t"
                    style={{ borderColor: "var(--color-border-form)" }}
                  >
                    <td className="px-5 py-4 text-center">
                      <span className="text-[13px] font-bold text-[var(--color-text-brand)]">
                        {task.title}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
                            task.assigned_user ? avatarFor(name) : "bg-slate-300 dark:bg-slate-600"
                          )}
                        >
                          {initialsOf(name)}
                        </span>
                        <span className="text-[13px] ds-text-gray whitespace-nowrap">{name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded-md bg-[var(--color-bg)] px-2.5 py-1 text-[12px] font-semibold ds-text-primary">
                        {t("pts", { points: storyPointsOf(task) })}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--color-bg)] px-2.5 py-1 text-[12px] font-medium ds-text-gray">
                          <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY_DOT[priorityKey])} />
                          {t(`priority.${priorityKey}`)}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center rounded-md bg-[var(--color-bg)] px-2.5 py-1 text-[12px] font-medium ds-text-gray">
                        {t(`status.${boardStatusOf(task)}`)}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <select
                          value={task.sprint_id ?? ""}
                          disabled={!canEdit}
                          onChange={(event) =>
                            onMoveToSprint(
                              task.id,
                              event.target.value === "" ? null : Number(event.target.value)
                            )
                          }
                          className="h-9 w-[170px] rounded-lg border ds-border-form ds-bg-form px-2 text-[12px] ds-text-gray outline-none disabled:opacity-50"
                        >
                          <option value="">{t("selectSprint")}</option>
                          {sprintOptions.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                              {sprint.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div
          className="flex items-center justify-end gap-1.5 border-t px-5 py-3"
          style={{ borderColor: "var(--color-border-form)" }}
        >
          <PagerButton
            label="‹"
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
          />
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((number) => (
            <PagerButton
              key={number}
              label={String(number)}
              active={number === current}
              onClick={() => onPageChange(number)}
            />
          ))}
          <PagerButton
            label="›"
            disabled={current === pageCount}
            onClick={() => onPageChange(current + 1)}
          />
        </div>
      )}
    </div>
  );
}

function PagerButton({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-[12px] font-semibold transition-colors",
        active
          ? "bg-[var(--color-bg-primary-200)] text-[var(--color-text-brand)]"
          : "ds-text-gray-200 hover:bg-[var(--color-bg)]",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      {label}
    </button>
  );
}
