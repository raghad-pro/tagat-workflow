import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  CompleteSprintPayload,
  CreateSprintPayload,
  KanbanData,
  MoveTaskPayload,
  Sprint,
  SprintAssignee,
  SprintsBoardData,
  UpdateTaskStatusPayload,
} from "../types/sprints.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

const EMPTY_BOARD: SprintsBoardData = {
  projects: [],
  selected_project: null,
  sprints: [],
  backlog_tasks: [],
};

const EMPTY_KANBAN: KanbanData = {
  projects: [],
  selected_project: null,
  active_sprint: null,
  tasks: [],
};

/**
 * Sprint & kanban endpoints.
 *
 * Two absences shape everything built on top of this:
 *
 * 1. There is **no** `GET/PUT/DELETE /sprints/{id}`. All three answer 404 for
 *    every method, while `/sprints/{id}/start` answers 405 to a GET — which is
 *    how a Laravel route that exists but rejects the verb replies, so the
 *    missing ones genuinely are not registered. A sprint therefore cannot be
 *    renamed, re-dated or deleted once created, and the UI must not offer it.
 *
 * 2. `GET /sprints/data-by-company/{id}` is documented but 500s with
 *    `Unknown column 'name' in 'SELECT' … select id, title, name from projects`
 *    — the controller selects a column the `projects` table does not have. It
 *    is not used here; `GET /sprints` already returns the project list.
 */
export const sprintsApi = {
  /**
   * Backlog + every sprint of one project. Without `project_id` the server
   * picks a project itself and reports it back as `selected_project`.
   */
  getBoard: async (role: string, projectId?: number | null) => {
    const response = await apiClient.get<ApiResponse<SprintsBoardData>>(
      `${getRolePrefix(role)}/sprints`,
      // `apiClient.get` wraps this as axios `{ params }` itself — passing
      // `{ params }` here would serialise as `?params[project_id]=`.
      projectId ? { project_id: projectId } : undefined
    );
    const data = response?.data;
    if (!data) return EMPTY_BOARD;
    return {
      projects: data.projects ?? [],
      selected_project: data.selected_project ?? null,
      sprints: data.sprints ?? [],
      backlog_tasks: data.backlog_tasks ?? [],
    };
  },

  /** The running sprint's tasks, flat — the board groups them by status. */
  getKanban: async (role: string, projectId?: number | null) => {
    const response = await apiClient.get<ApiResponse<KanbanData>>(
      `${getRolePrefix(role)}/kanban`,
      projectId ? { project_id: projectId } : undefined
    );
    const data = response?.data;
    if (!data) return EMPTY_KANBAN;
    return {
      projects: data.projects ?? [],
      selected_project: data.selected_project ?? null,
      active_sprint: data.active_sprint ?? null,
      tasks: data.tasks ?? [],
    };
  },

  getSprintsByProject: async (role: string, projectId: number) => {
    const response = await apiClient.get<ApiResponse<Sprint[]>>(
      `${getRolePrefix(role)}/sprints/by-project/${projectId}`
    );
    return response?.data ?? [];
  },

  getProjectEmployees: async (role: string, projectId: number) => {
    const response = await apiClient.get<ApiResponse<{ employees: SprintAssignee[] }>>(
      `${getRolePrefix(role)}/sprints/employees-by-project/${projectId}`
    );
    return response?.data?.employees ?? [];
  },

  create: async (role: string, payload: CreateSprintPayload) => {
    const response = await apiClient.post<ApiResponse<Sprint>>(
      `${getRolePrefix(role)}/sprints`,
      payload
    );
    return response?.data;
  },

  /**
   * Only one sprint may run per project — the server answers
   * "يوجد بالفعل سبرنت نشط لهذا المشروع!" otherwise. The UI hides the button in
   * that case, but the check stays here as the real gate.
   */
  start: async (role: string, sprintId: number) => {
    const response = await apiClient.post<ApiResponse<Sprint>>(
      `${getRolePrefix(role)}/sprints/${sprintId}/start`
    );
    return response?.data;
  },

  complete: async (role: string, sprintId: number, payload: CompleteSprintPayload) => {
    const response = await apiClient.post<ApiResponse<Sprint>>(
      `${getRolePrefix(role)}/sprints/${sprintId}/complete`,
      payload
    );
    return response?.data;
  },

  /** Between backlog and sprint. `sprint_id: null` means "back to backlog". */
  moveTask: async (role: string, payload: MoveTaskPayload) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `${getRolePrefix(role)}/sprints/move-task`,
      { task_id: payload.task_id, sprint_id: payload.sprint_id ?? null }
    );
    return response?.data;
  },

  /** Between board columns. */
  updateTaskStatus: async (role: string, payload: UpdateTaskStatusPayload) => {
    const response = await apiClient.post<ApiResponse<unknown>>(
      `${getRolePrefix(role)}/kanban/update-status`,
      payload
    );
    return response?.data;
  },
};
