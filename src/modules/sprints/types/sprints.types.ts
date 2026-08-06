/**
 * Shapes verified against the live API (`https://workflow.aliservice.site/api/v1`)
 * as super admin, not from the Postman collection alone — the collection is
 * accurate about the routes but says nothing about the response envelopes.
 */

/**
 * The four columns of the board. Verified by probing
 * `POST /kanban/update-status` with each candidate: `review`, `done`,
 * `blocked`, `cancelled` and `on_hold` are all rejected.
 */
export const KANBAN_STATUSES = [
  "todo",
  "in_progress",
  "in_review",
  "completed",
] as const;

export type KanbanStatus = (typeof KANBAN_STATUSES)[number];

export function isKanbanStatus(value: unknown): value is KanbanStatus {
  return KANBAN_STATUSES.includes(String(value) as KanbanStatus);
}

/** `planned` until started, `active` while running, `completed` once closed. */
export type SprintStatus = "planned" | "active" | "completed";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface SprintProject {
  id: number;
  company_id?: number;
  client_id?: number;
  leader_id?: number;
  currency_id?: number;
  title: string;
  description?: string | null;
  budget?: string | null;
  status?: string;
}

export interface SprintAssignee {
  id: number;
  name?: string;
  email?: string;
  image?: string | null;
  company_id?: number;
}

export interface SprintTask {
  id: number;
  project_id: number;
  /** `null` means the task sits in the backlog. */
  sprint_id: number | null;
  assigned_to?: number | null;
  title: string;
  description?: string | null;
  story_points?: number | null;
  priority?: TaskPriority | string;
  status?: KanbanStatus | string;
  completed_at?: string | null;
  completed_by?: number | null;
  task_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  /** Minutes, derived server-side from start/end. */
  duration?: number | null;
  cost?: number | null;
  assigned_user?: SprintAssignee | null;
}

export interface Sprint {
  id: number;
  project_id: number;
  name: string;
  goal?: string | null;
  start_date: string;
  end_date: string;
  status: SprintStatus | string;
  created_at?: string;
  updated_at?: string;
  /** Present on the list endpoints, absent on the kanban endpoint. */
  tasks?: SprintTask[];
}

/**
 * `GET /{prefix}/sprints[?project_id=]`.
 *
 * The endpoint doubles as the project picker's data source: it returns every
 * project the account may see plus the one it decided to show. There is no
 * separate "list projects for sprints" route that works — `data-by-company/{id}`
 * is documented for that but 500s (see the audit note in the API layer).
 */
export interface SprintsBoardData {
  projects: SprintProject[];
  selected_project: SprintProject | null;
  sprints: Sprint[];
  backlog_tasks: SprintTask[];
}

/** `GET /{prefix}/kanban?project_id=` — flat task list plus the running sprint. */
export interface KanbanData {
  projects: SprintProject[];
  selected_project: SprintProject | null;
  active_sprint: Sprint | null;
  tasks: SprintTask[];
}

export interface CreateSprintPayload {
  project_id: number;
  name: string;
  goal?: string | null;
  start_date: string;
  end_date: string;
}

/**
 * Where the sprint's unfinished tasks go when it closes. Both values verified;
 * `next_sprint` additionally requires `next_sprint_id`, enforced server-side
 * with "The next sprint id field is required when move to is next_sprint."
 */
export type CompleteSprintMoveTo = "backlog" | "next_sprint";

export interface CompleteSprintPayload {
  move_to: CompleteSprintMoveTo;
  next_sprint_id?: number;
}

export interface MoveTaskPayload {
  task_id: number;
  /** Omitted or `null` sends the task back to the backlog. */
  sprint_id?: number | null;
}

export interface UpdateTaskStatusPayload {
  task_id: number;
  status: KanbanStatus;
}

// ─── Derived helpers ───────────────────────────────────────────────────────────

/** Story points are nullable and arrive as `0` for "unestimated". */
export function storyPointsOf(task: SprintTask): number {
  const points = Number(task.story_points ?? 0);
  return Number.isFinite(points) ? points : 0;
}

export function sumStoryPoints(tasks: SprintTask[]): number {
  return tasks.reduce((total, task) => total + storyPointsOf(task), 0);
}

/**
 * A status the board can render. Anything unrecognised is parked in `todo`
 * rather than dropped — a task that vanishes from the board is worse than one
 * in the wrong column, and the server has more statuses in its tasks table
 * (`pending`) than the kanban validator accepts.
 */
export function boardStatusOf(task: SprintTask): KanbanStatus {
  return isKanbanStatus(task.status) ? task.status : "todo";
}

export function isSprintActive(sprint: Sprint): boolean {
  return String(sprint.status) === "active";
}

export function isSprintCompleted(sprint: Sprint): boolean {
  return String(sprint.status) === "completed";
}

/** Whole days from today to the end date; negative once overdue. */
export function daysRemaining(sprint: Sprint): number | null {
  if (!sprint.end_date) return null;
  const end = new Date(`${sprint.end_date}T23:59:59`);
  if (Number.isNaN(end.getTime())) return null;
  return Math.ceil((end.getTime() - Date.now()) / 86_400_000);
}

export function sprintProgress(tasks: SprintTask[]): {
  done: number;
  total: number;
  percent: number;
} {
  const total = tasks.length;
  const done = tasks.filter((task) => boardStatusOf(task) === "completed").length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}
