/**
 * Project AI — requirement documents, AI plan suggestions, and risk alerts.
 *
 * The collection documents every route and its validation rules but ships no
 * response examples, so these types name only what the screens rely on and
 * leave the rest open. `utils/shape.ts` reads through them tolerantly.
 */
export type Id = number | string;

/**
 * Which project, and on whose behalf.
 *
 * `companyId` is sent as `X-Company` — only a super admin needs it, since a
 * company admin's tenant is their own. Without it a super admin's request
 * would be judged against *their* company rather than the project's.
 */
export interface AiScope {
  role: string;
  projectId: Id;
  companyId?: Id;
}

export interface Page<T> {
  items: T[];
  page: number;
  lastPage: number;
  total: number;
}

// ─── Documents ────────────────────────────────────────────────────────────────

/** Stored on a private disk: no path, no download — only what describes it. */
export interface AiDocument {
  id: Id;
  original_name?: string;
  name?: string;
  size?: number;
  mime_type?: string;
  status?: string;
  created_at?: string;
  [key: string]: unknown;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type Priority = (typeof PRIORITIES)[number];

export interface SprintSuggestion {
  id: Id;
  title?: string;
  goal?: string | null;
  position?: number;
  start_date?: string | null;
  end_date?: string | null;
  is_included?: boolean;
  tasks?: TaskSuggestion[];
  [key: string]: unknown;
}

export interface TaskSuggestion {
  id: Id;
  title?: string;
  description?: string | null;
  story_points?: number | null;
  priority?: Priority | null;
  sprint_suggestion_id?: Id | null;
  position?: number;
  assigned_to?: Id | null;
  is_included?: boolean;
  [key: string]: unknown;
}

export interface AiPlan {
  id: Id;
  status?: string;
  sprints?: SprintSuggestion[];
  tasks?: TaskSuggestion[];
  created_at?: string;
  approved_at?: string | null;
  [key: string]: unknown;
}

/** `PATCH …/review` — every field optional, ids are the *suggestion* ids. */
export interface SprintReview {
  id: number;
  is_included?: boolean;
  title?: string;
  goal?: string | null;
  position?: number;
  start_date?: string | null;
  end_date?: string | null;
}

export interface TaskReview {
  id: number;
  is_included?: boolean;
  title?: string;
  description?: string | null;
  story_points?: number | null;
  priority?: Priority | null;
  sprint_suggestion_id?: number;
  position?: number;
  assigned_to?: number | null;
  unassign?: boolean;
}

export interface ReviewPlanPayload {
  sprints?: SprintReview[];
  tasks?: TaskReview[];
}

// ─── Risk alerts ──────────────────────────────────────────────────────────────

export const ALERT_STATUSES = ["open", "acknowledged", "resolved"] as const;

export interface RiskAlert {
  id: Id;
  status?: string;
  severity?: string;
  type?: string;
  title?: string;
  message?: string;
  explanation?: string | null;
  created_at?: string;
  acknowledged_at?: string | null;
  [key: string]: unknown;
}

export interface AlertsParams {
  status?: string;
  page?: number;
  per_page?: number;
}
