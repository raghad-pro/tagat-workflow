import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sprintsApi } from "../api/sprints.api";
import type {
  CompleteSprintPayload,
  CreateSprintPayload,
  KanbanData,
  KanbanStatus,
  SprintsBoardData,
  SprintTask,
} from "../types/sprints.types";

/**
 * `project_id` is part of every key: the board and the kanban are per-project,
 * and sharing one entry across projects would show the previous project's
 * columns for a frame after switching.
 */
export const sprintKeys = {
  all: (role: string) => ["sprints", role] as const,
  board: (role: string, projectId?: number | null) =>
    ["sprints", role, "board", projectId ?? null] as const,
  kanban: (role: string, projectId?: number | null) =>
    ["sprints", role, "kanban", projectId ?? null] as const,
  byProject: (role: string, projectId: number) =>
    ["sprints", role, "by-project", projectId] as const,
  employees: (role: string, projectId: number) =>
    ["sprints", role, "employees", projectId] as const,
};

export function useSprintBoard(role: string, projectId?: number | null) {
  return useQuery({
    queryKey: sprintKeys.board(role, projectId),
    queryFn: () => sprintsApi.getBoard(role, projectId),
    // Keep the previous project's board on screen while the next one loads,
    // instead of collapsing the page to a spinner on every switch.
    placeholderData: (previous) => previous,
  });
}

export function useKanban(role: string, projectId?: number | null) {
  return useQuery({
    queryKey: sprintKeys.kanban(role, projectId),
    queryFn: () => sprintsApi.getKanban(role, projectId),
    placeholderData: (previous) => previous,
  });
}

/**
 * Sprints of one project, for a picker. Separate from `useSprintBoard` because
 * the board pulls every task with every sprint; a dropdown needs neither.
 */
export function useSprintsByProject(role: string, projectId?: number | null) {
  return useQuery({
    queryKey: sprintKeys.byProject(role, projectId ?? 0),
    queryFn: () => sprintsApi.getSprintsByProject(role, projectId as number),
    enabled: Boolean(projectId),
  });
}

export function useProjectEmployees(role: string, projectId?: number | null) {
  return useQuery({
    queryKey: sprintKeys.employees(role, projectId ?? 0),
    queryFn: () => sprintsApi.getProjectEmployees(role, projectId as number),
    enabled: Boolean(projectId),
  });
}

/**
 * Every sprint mutation touches both the planning board and the kanban — a
 * completed sprint empties the board's columns, a moved task leaves one list
 * and joins another — so they are always invalidated together.
 */
export function useSprintMutations(role: string, projectId?: number | null) {
  const queryClient = useQueryClient();

  const boardKey = sprintKeys.board(role, projectId);
  const kanbanKey = sprintKeys.kanban(role, projectId);

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: sprintKeys.all(role) });

  const createSprint = useMutation({
    mutationFn: (payload: CreateSprintPayload) => sprintsApi.create(role, payload),
    onSuccess: invalidateAll,
  });

  const startSprint = useMutation({
    mutationFn: (sprintId: number) => sprintsApi.start(role, sprintId),
    onSuccess: invalidateAll,
  });

  const completeSprint = useMutation({
    mutationFn: ({ sprintId, payload }: { sprintId: number; payload: CompleteSprintPayload }) =>
      sprintsApi.complete(role, sprintId, payload),
    onSuccess: invalidateAll,
  });

  /**
   * Column drag. Applied to the cache first so the card stays under the cursor
   * where it was dropped — a card that snaps back for 400ms and then jumps
   * forward reads as a failed drop.
   */
  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: KanbanStatus }) =>
      sprintsApi.updateTaskStatus(role, { task_id: taskId, status }),

    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: kanbanKey });
      const previous = queryClient.getQueryData<KanbanData>(kanbanKey);

      queryClient.setQueryData<KanbanData>(kanbanKey, (old) =>
        old
          ? {
              ...old,
              tasks: old.tasks.map((task) =>
                task.id === taskId ? { ...task, status } : task
              ),
            }
          : old
      );

      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(kanbanKey, context.previous);
    },

    onSettled: invalidateAll,
  });

  /**
   * Backlog ↔ sprint drag, optimistic in the same way. Both caches are patched
   * because the planning page reads the board while the board tab reads the
   * kanban, and the two are visible in the same session.
   */
  const moveTask = useMutation({
    mutationFn: ({ taskId, sprintId }: { taskId: number; sprintId: number | null }) =>
      sprintsApi.moveTask(role, { task_id: taskId, sprint_id: sprintId }),

    onMutate: async ({ taskId, sprintId }) => {
      await queryClient.cancelQueries({ queryKey: boardKey });
      const previous = queryClient.getQueryData<SprintsBoardData>(boardKey);
      if (!previous) return { previous };

      // Find the task wherever it currently lives.
      let moved: SprintTask | undefined = previous.backlog_tasks.find((t) => t.id === taskId);
      for (const sprint of previous.sprints) {
        if (moved) break;
        moved = (sprint.tasks ?? []).find((t) => t.id === taskId);
      }
      if (!moved) return { previous };

      const detached: SprintsBoardData = {
        ...previous,
        backlog_tasks: previous.backlog_tasks.filter((t) => t.id !== taskId),
        sprints: previous.sprints.map((sprint) => ({
          ...sprint,
          tasks: (sprint.tasks ?? []).filter((t) => t.id !== taskId),
        })),
      };

      const relocated: SprintTask = { ...moved, sprint_id: sprintId };
      const next: SprintsBoardData =
        sprintId === null
          ? { ...detached, backlog_tasks: [relocated, ...detached.backlog_tasks] }
          : {
              ...detached,
              sprints: detached.sprints.map((sprint) =>
                sprint.id === sprintId
                  ? { ...sprint, tasks: [...(sprint.tasks ?? []), relocated] }
                  : sprint
              ),
            };

      queryClient.setQueryData(boardKey, next);
      return { previous };
    },

    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(boardKey, context.previous);
    },

    onSettled: invalidateAll,
  });

  return {
    createSprint: createSprint.mutateAsync,
    isCreatingSprint: createSprint.isPending,
    startSprint: startSprint.mutateAsync,
    isStartingSprint: startSprint.isPending,
    completeSprint: completeSprint.mutateAsync,
    isCompletingSprint: completeSprint.isPending,
    updateTaskStatus: updateTaskStatus.mutateAsync,
    isUpdatingStatus: updateTaskStatus.isPending,
    moveTask: moveTask.mutateAsync,
    isMovingTask: moveTask.isPending,
  };
}
