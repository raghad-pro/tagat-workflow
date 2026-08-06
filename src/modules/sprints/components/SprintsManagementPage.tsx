"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { KanbanSquare, ListChecks, Plus } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { usePermission } from "@/hooks/usePermission";
import { PageContainer } from "@/components/template/PageContainer";
import { Button } from "@/components/atoms/Button";
import { cn } from "@/lib/utils";

import AddTaskModal from "@/modules/tasks/components/AddTaskModal";
import { useCreateTask } from "@/modules/tasks/hooks/useTasks";

import { useKanban, useSprintBoard, useSprintMutations } from "../hooks/useSprints";
import { BacklogTable } from "./BacklogTable";
import { SprintRow } from "./SprintRow";
import { KanbanBoard } from "./KanbanBoard";
import CreateSprintModal from "./CreateSprintModal";
import CompleteSprintModal from "./CompleteSprintModal";
import {
  isSprintActive,
  type CompleteSprintPayload,
  type KanbanStatus,
  type Sprint,
} from "../types/sprints.types";

type View = "backlog" | "board";

const BACKLOG_PAGE_SIZE = 5;

/** The server's validation errors, flattened into one readable line. */
function apiMessage(error: unknown, fallback: string): string {
  const response = (error as {
    response?: { data?: { message?: string; errors?: Record<string, string[]> } };
  })?.response?.data;
  const firstFieldError = Object.values(response?.errors ?? {})[0]?.[0];
  return firstFieldError || response?.message || (error as Error)?.message || fallback;
}

export default function SprintsManagementPage() {
  const t = useTranslations("sprint");
  const tCommon = useTranslations("common");
  const { user } = useAuth();
  const role = user?.role || "company";
  const { can } = usePermission();

  // A client may read the plan but not reshape it. Everyone else rides on the
  // same permission as the tasks page — moving a task between sprints is an
  // edit to a task row.
  const canEdit = role !== "client" && can("tasks.update");

  const [view, setView] = useState<View>("backlog");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [backlogPage, setBacklogPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [sprintToComplete, setSprintToComplete] = useState<Sprint | null>(null);

  const board = useSprintBoard(role, projectId);
  const kanban = useKanban(role, projectId);
  const createTask = useCreateTask();

  const {
    createSprint,
    isCreatingSprint,
    startSprint,
    isStartingSprint,
    completeSprint,
    isCompletingSprint,
    updateTaskStatus,
    moveTask,
  } = useSprintMutations(role, projectId);

  const projects = board.data?.projects ?? [];
  const selectedProject = board.data?.selected_project ?? null;
  const sprints = board.data?.sprints ?? [];
  const backlogTasks = board.data?.backlog_tasks ?? [];

  /**
   * The first request carries no `project_id`, so the server picks a project and
   * names it in `selected_project`. Adopting that pins every later request to
   * the same one — otherwise the backlog and the board could each be answered
   * about a different project.
   */
  useEffect(() => {
    if (projectId === null && selectedProject?.id) setProjectId(selectedProject.id);
  }, [projectId, selectedProject?.id]);

  // Switching project invalidates the page the user was on.
  useEffect(() => setBacklogPage(1), [projectId]);

  const hasActiveSprint = useMemo(() => sprints.some(isSprintActive), [sprints]);

  const otherSprints = useMemo(
    () => sprints.filter((sprint) => sprint.id !== sprintToComplete?.id),
    [sprints, sprintToComplete?.id]
  );

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreateSprint = async (values: {
    project: string;
    name: string;
    goal?: string;
    start_date: string;
    end_date: string;
  }) => {
    try {
      await createSprint({
        project_id: Number(values.project),
        name: values.name,
        goal: values.goal?.trim() ? values.goal.trim() : null,
        start_date: values.start_date,
        end_date: values.end_date,
      });
      setIsCreateOpen(false);
      toast.success(t("toast.created"));
    } catch (error) {
      toast.error(apiMessage(error, tCommon("error")));
    }
  };

  const handleStartSprint = async (sprint: Sprint) => {
    try {
      await startSprint(sprint.id);
      toast.success(t("toast.started", { name: sprint.name }));
      setView("board");
    } catch (error) {
      toast.error(apiMessage(error, tCommon("error")));
    }
  };

  const handleCompleteSprint = async (payload: CompleteSprintPayload) => {
    if (!sprintToComplete) return;
    try {
      await completeSprint({ sprintId: sprintToComplete.id, payload });
      toast.success(t("toast.completed", { name: sprintToComplete.name }));
      setSprintToComplete(null);
    } catch (error) {
      toast.error(apiMessage(error, tCommon("error")));
    }
  };

  const handleMoveTask = async (taskId: number, sprintId: number | null) => {
    try {
      await moveTask({ taskId, sprintId });
    } catch (error) {
      // The cache rolled back already; this only explains why.
      toast.error(apiMessage(error, tCommon("error")));
    }
  };

  const handleStatusChange = async (taskId: number, status: KanbanStatus) => {
    try {
      await updateTaskStatus({ taskId, status });
    } catch (error) {
      toast.error(apiMessage(error, tCommon("error")));
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <PageContainer
      isLoading={board.isLoading && !board.data}
      skeletonVariant="table"
      isError={board.isError}
      error={board.error}
      onRetry={() => board.refetch()}
    >
      <div className="flex flex-col gap-5">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold ds-text-primary">{t("pageTitle")}</h1>
            <p className="mt-1 text-[13px] ds-text-gray-200">{t("pageSubtitle")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {projects.length > 1 && (
              <select
                value={projectId ?? ""}
                onChange={(event) => setProjectId(Number(event.target.value))}
                className="h-10 rounded-xl border ds-border-form ds-bg-form px-3 text-[13px] ds-text-primary outline-none"
                aria-label={t("fields.project")}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            )}

            <Button
              variant="outline"
              size="md"
              onClick={() => setView(view === "board" ? "backlog" : "board")}
              licon={view === "board" ? <ListChecks size={16} /> : <KanbanSquare size={16} />}
            >
              {view === "board" ? t("backlogView") : t("kanbanBoard")}
            </Button>

            {canEdit && (
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
              >
                <Plus size={16} />
                {t("createSprint")}
              </button>
            )}

            {canEdit && (
              <Button
                variant="solid"
                size="md"
                onClick={() => setIsAddTaskOpen(true)}
                licon={<Plus size={16} />}
              >
                {t("addTasks")}
              </Button>
            )}
          </div>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-2xl border ds-border-form p-12 text-center">
            <p className="text-[15px] font-bold ds-text-primary">{t("noProjects")}</p>
            <p className="mt-1 text-[13px] ds-text-gray-200">{t("noProjectsHint")}</p>
          </div>
        ) : view === "board" ? (
          <KanbanBoard
            activeSprint={kanban.data?.active_sprint ?? null}
            tasks={kanban.data?.tasks ?? []}
            onStatusChange={handleStatusChange}
            canEdit={canEdit}
          />
        ) : (
          <>
            {/* ── Sprint rows ─────────────────────────────────────────────── */}
            {sprints.length === 0 ? (
              <div className="rounded-2xl border ds-border-form p-10 text-center">
                <p className="text-[14px] font-bold ds-text-primary">{t("noSprints")}</p>
                <p className="mt-1 text-[13px] ds-text-gray-200">{t("noSprintsHint")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sprints.map((sprint) => (
                  <SprintRow
                    key={sprint.id}
                    sprint={sprint}
                    hasActiveSprint={hasActiveSprint}
                    onStart={handleStartSprint}
                    onComplete={setSprintToComplete}
                    canEdit={canEdit}
                    isBusy={isStartingSprint || isCompletingSprint}
                  />
                ))}
              </div>
            )}

            {/* ── Product backlog ─────────────────────────────────────────── */}
            <BacklogTable
              tasks={backlogTasks}
              sprints={sprints}
              onMoveToSprint={handleMoveTask}
              onAddTask={() => setIsAddTaskOpen(true)}
              canEdit={canEdit}
              page={backlogPage}
              pageSize={BACKLOG_PAGE_SIZE}
              onPageChange={setBacklogPage}
            />
          </>
        )}
      </div>

      <CreateSprintModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSprint}
        isLoading={isCreatingSprint}
        projects={projects}
        defaultProjectId={projectId}
      />

      <CompleteSprintModal
        isOpen={sprintToComplete !== null}
        onClose={() => setSprintToComplete(null)}
        sprint={sprintToComplete}
        otherSprints={otherSprints}
        onConfirm={handleCompleteSprint}
        isLoading={isCompletingSprint}
      />

      <AddTaskModal
        isOpen={isAddTaskOpen}
        onClose={() => setIsAddTaskOpen(false)}
        isLoading={createTask.isPending}
        onSubmit={(values, setError) => {
          createTask.mutate(
            {
              project_id: values.project,
              assigned_to: values.employee,
              title: values.title,
              description: values.notes,
              status: "todo",
              priority: values.priority || "medium",
              story_points: values.storyPoints ? Number(values.storyPoints) : 0,
              // Left in the backlog unless the dialog picked a sprint — which is
              // what "Add Backlog Task" is for.
              sprint_id: values.sprint ? Number(values.sprint) : null,
              task_date: new Date().toISOString().split("T")[0],
              start_time: values.start,
              end_time: values.end,
            },
            {
              onSuccess: () => {
                setIsAddTaskOpen(false);
                void board.refetch();
              },
              onError: (error: unknown) => {
                const fields = (error as { response?: { data?: { errors?: Record<string, string[]> } } })
                  ?.response?.data?.errors;
                toast.error(apiMessage(error, tCommon("error")));
                for (const [field, messages] of Object.entries(fields ?? {})) {
                  const mapped =
                    { assigned_to: "employee", project_id: "project", sprint_id: "sprint" }[field] ?? field;
                  setError(mapped, { type: "server", message: messages[0] });
                }
              },
            }
          );
        }}
      />
    </PageContainer>
  );
}
