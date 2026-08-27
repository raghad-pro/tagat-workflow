"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CalendarClock, LayoutGrid } from "lucide-react";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/lib/utils";
import { DroppableZone } from "./DroppableZone";
import { SprintTaskCard } from "./SprintTaskCard";
import {
  KANBAN_STATUSES,
  boardStatusOf,
  daysRemaining,
  sumStoryPoints,
  type KanbanStatus,
  type Sprint,
  type SprintTask,
} from "../types/sprints.types";

const COLUMN_ACCENT: Record<KanbanStatus, string> = {
  todo: "bg-slate-400",
  in_progress: "bg-[var(--color-bg-primary)]",
  in_review: "bg-[var(--color-status-pending)]",
  completed: "bg-[var(--color-status-approved)]",
};

interface KanbanBoardProps {
  activeSprint: Sprint | null;
  tasks: SprintTask[];
  onStatusChange: (taskId: number, status: KanbanStatus) => void;
  canEdit: boolean;
  /**
   * Per-card drag permission. A project member may only move their own work,
   * while the lead moves any card. Omitted means every card is draggable.
   */
  canDragTask?: (task: SprintTask) => boolean;
  onViewTask?: (task: SprintTask) => void;
  onEditTask?: (task: SprintTask) => void;
  onDeleteTask?: (task: SprintTask) => void;
  /** Off for an employee: their cards carry the view control alone. */
  canManageTasks?: boolean;
}

export function KanbanBoard({
  activeSprint,
  tasks,
  onStatusChange,
  canEdit,
  canDragTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  canManageTasks,
}: KanbanBoardProps) {
  const t = useTranslations("sprint");
  const [draggingTask, setDraggingTask] = useState<SprintTask | null>(null);

  // A pointer must travel 6px before a drag begins, otherwise every click on a
  // card would be swallowed as a micro-drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } })
  );

  const columns = useMemo(() => {
    const grouped: Record<KanbanStatus, SprintTask[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      completed: [],
    };
    for (const task of tasks) grouped[boardStatusOf(task)].push(task);
    return grouped;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingTask((event.active.data.current?.task as SprintTask) ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const task = draggingTask;
    setDraggingTask(null);

    const target = event.over?.data.current;
    if (!task || !target || target.type !== "column") return;

    const status = target.status as KanbanStatus;
    // Dropping a card back where it started is not a change; firing the request
    // anyway would flash a toast for a no-op.
    if (boardStatusOf(task) === status) return;

    onStatusChange(task.id, status);
  };

  if (!activeSprint) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border ds-border-form p-12 text-center">
        <LayoutGrid size={30} className="ds-text-gray-200" />
        <Text size="base" weight="bold">{t("board.noActiveSprint")}</Text>
        <Text size="sm" className="ds-text-gray-200 max-w-sm">
          {t("board.noActiveSprintHint")}
        </Text>
      </div>
    );
  }

  const remaining = daysRemaining(activeSprint);

  return (
    <div className="flex flex-col gap-4">
      {/* Running sprint summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border ds-border-form ds-bg-form p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--color-status-approved)]" />
            <Text size="base" weight="bold" className="truncate">{activeSprint.name}</Text>
          </div>
          {activeSprint.goal && (
            <Text size="sm" className="ds-text-gray-200 mt-1 line-clamp-1">
              {activeSprint.goal}
            </Text>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-[15px] font-bold ds-text-brand">{sumStoryPoints(tasks)}</p>
            <p className="text-[10px] ds-text-gray-200">{t("storyPoints")}</p>
          </div>
          {remaining !== null && (
            <div className="flex items-center gap-1.5 rounded-xl bg-[var(--color-bg)] px-3 py-1.5">
              <CalendarClock size={14} className="ds-text-gray-200" />
              <span
                className={cn(
                  "text-[12px] font-bold",
                  remaining < 0 ? "text-[var(--color-status-rejected)]" : "ds-text-primary"
                )}
              >
                {remaining < 0
                  ? t("overdueBy", { days: Math.abs(remaining) })
                  : t("daysLeft", { days: remaining })}
              </span>
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setDraggingTask(null)}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {KANBAN_STATUSES.map((status) => {
            const columnTasks = columns[status];
            return (
              <DroppableZone
                key={status}
                id={`column-${status}`}
                data={{ type: "column", status }}
                disabled={!canEdit}
                className="flex min-h-[220px] flex-col gap-2 border ds-border-form bg-[var(--color-bg)] p-3"
              >
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("h-2 w-2 rounded-full", COLUMN_ACCENT[status])} />
                    <span className="text-[12px] font-bold ds-text-primary">
                      {t(`status.${status}`)}
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--color-bg-form)] px-2 py-0.5 text-[11px] font-bold ds-text-gray-200">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {columnTasks.length === 0 ? (
                    <p className="px-1 py-6 text-center text-[11px] ds-text-gray-200">
                      {t("board.emptyColumn")}
                    </p>
                  ) : (
                    columnTasks.map((task) => (
                      <SprintTaskCard
                        key={task.id}
                        task={task}
                        disabled={!canEdit || !(canDragTask?.(task) ?? true)}
                        onClick={onViewTask}
                        onView={onViewTask}
                        onEdit={onEditTask}
                        onDelete={onDeleteTask}
                        canManage={canManageTasks}
                      />
                    ))
                  )}
                </div>
              </DroppableZone>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingTask ? <SprintTaskCard task={draggingTask} isOverlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
