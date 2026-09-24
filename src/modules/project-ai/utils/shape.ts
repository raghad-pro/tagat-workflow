/**
 * Readers that tolerate the response shape.
 *
 * The collection documents the Project AI routes but ships no response
 * examples, so the screens read through these instead of naming a key
 * directly. When the real payloads are pinned down, this file is where the
 * guesswork gets deleted — not every component.
 */
import type {
  AiDocument,
  AiPlan,
  Page,
  RiskAlert,
  SprintSuggestion,
  TaskSuggestion,
} from "../types/project-ai.types";

// ─── Primitives ───────────────────────────────────────────────────────────────

/** The first key that actually holds a value. */
function pick<T>(source: unknown, keys: string[]): T | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
}

export function num(source: unknown, keys: string[], fallback = 0): number {
  const value = pick<unknown>(source, keys);
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && !Number.isNaN(parsed) ? parsed : fallback;
}

export function str(source: unknown, keys: string[], fallback = ""): string {
  const value = pick<unknown>(source, keys);
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}

/** `true`/`false`, or the fallback when the key is absent. Laravel may send 1/0. */
export function bool(source: unknown, keys: string[], fallback: boolean): boolean {
  const value = pick<unknown>(source, keys);
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return fallback;
}

// ─── Envelopes ────────────────────────────────────────────────────────────────

/** `{ success, data }`, a bare resource, or `{ data: { data } }` — the payload. */
export function unwrap<T = unknown>(body: unknown): T {
  const data = (body as { data?: unknown } | null)?.data;
  return (data === undefined ? body : data) as T;
}

export function unwrapList<T = unknown>(body: unknown): T[] {
  if (Array.isArray(body)) return body as T[];
  const first = (body as { data?: unknown } | null)?.data;
  if (Array.isArray(first)) return first as T[];
  const second = (first as { data?: unknown } | null)?.data;
  if (Array.isArray(second)) return second as T[];
  return [];
}

/**
 * A paginated list with its page numbers — a Laravel paginator puts them
 * beside `data`, a resource collection under `meta`, and the envelope may wrap
 * either. A plain array is a single page.
 */
export function unwrapPage<T = unknown>(body: unknown): Page<T> {
  const items = unwrapList<T>(body);
  const envelope = body as { data?: unknown; meta?: unknown } | null;
  const inner = envelope?.data as { meta?: unknown } | null;
  const candidates = [envelope?.meta, inner?.meta, inner, envelope];
  const meta = candidates.find((c) => c && typeof c === "object" && "current_page" in c);

  return {
    items,
    page: num(meta, ["current_page"], 1),
    lastPage: num(meta, ["last_page"], 1),
    total: num(meta, ["total"], items.length),
  };
}

/**
 * The sentence a failed request carries.
 *
 * The axios interceptor already lifts `message`; a 422 is more useful with its
 * first field error, and a 409 from plan generation names its `ai_outcome`.
 */
export function errorMessage(error: unknown, fallback = "Request failed"): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  const errors = (data as { errors?: unknown } | undefined)?.errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const first = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
  }
  return (error as { message?: string })?.message || str(data, ["message"]) || fallback;
}

export const errorStatus = (error: unknown) =>
  (error as { response?: { status?: number } })?.response?.status;

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentName = (doc: AiDocument) =>
  str(doc, ["original_name", "name", "filename", "title"], `#${doc.id}`);

export const documentSize = (doc: AiDocument) => num(doc, ["size", "size_bytes", "bytes"]);

export const documentStatus = (doc: AiDocument) =>
  str(doc, ["status", "extraction_status", "parse_status"]);

// ─── Plans ────────────────────────────────────────────────────────────────────

export const planStatus = (plan: AiPlan | undefined) =>
  str(plan, ["status", "state"], "draft").toLowerCase();

/** Approved plans have created real sprints and tasks — they are read-only. */
export const isPlanApproved = (plan: AiPlan | undefined) =>
  !!plan && (planStatus(plan) === "approved" || !!str(plan, ["approved_at"]));

/** A plan whose generation did not produce anything reviewable. */
export const isPlanFailed = (plan: AiPlan | undefined) =>
  ["failed", "error", "rejected"].includes(planStatus(plan));

export const planSummary = (plan: AiPlan | undefined) =>
  str(plan, ["summary", "overview", "description", "notes"]);

/** Where the suggestion came from — `gemini`, `heuristic`, `fallback`, … */
export const planSource = (plan: AiPlan | undefined) =>
  str(plan, ["ai_outcome", "source", "generator", "provider"]);

const byPosition = <T extends { position?: number }>(a: T, b: T) =>
  num(a, ["position"], 0) - num(b, ["position"], 0);

export function planSprints(plan: AiPlan | undefined): SprintSuggestion[] {
  if (!plan) return [];
  const list = plan.sprints ?? (plan as { sprint_suggestions?: unknown }).sprint_suggestions;
  return Array.isArray(list) ? [...(list as SprintSuggestion[])].sort(byPosition) : [];
}

/**
 * Every task suggestion in the plan.
 *
 * The review route takes a flat `tasks[]` with `sprint_suggestion_id`, but the
 * show route may equally nest them under their sprint — so both are read, and
 * a nested task learns its sprint from where it was found.
 */
export function planTasks(plan: AiPlan | undefined): TaskSuggestion[] {
  if (!plan) return [];
  const flat = plan.tasks ?? (plan as { task_suggestions?: unknown }).task_suggestions;
  const seen = new Map<string, TaskSuggestion>();

  if (Array.isArray(flat)) {
    for (const task of flat as TaskSuggestion[]) seen.set(String(task.id), task);
  }
  for (const sprint of planSprints(plan)) {
    const nested = sprint.tasks ?? (sprint as { task_suggestions?: unknown }).task_suggestions;
    if (!Array.isArray(nested)) continue;
    for (const task of nested as TaskSuggestion[]) {
      if (seen.has(String(task.id))) continue;
      seen.set(String(task.id), { sprint_suggestion_id: sprint.id, ...task });
    }
  }
  return [...seen.values()].sort(byPosition);
}

export const taskSprintId = (task: TaskSuggestion) =>
  str(task, ["sprint_suggestion_id", "sprint_id"]);

export const taskAssignee = (task: TaskSuggestion) => {
  const nested = (task as { assignee?: { id?: unknown } }).assignee?.id;
  return str(task, ["assigned_to", "assignee_id"]) || (nested ? String(nested) : "");
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const alertStatus = (alert: RiskAlert) => str(alert, ["status"], "open").toLowerCase();

export const alertSeverity = (alert: RiskAlert) =>
  str(alert, ["severity", "level", "risk_level"], "medium").toLowerCase();

export const alertTitle = (alert: RiskAlert) =>
  str(alert, ["title", "rule_label", "type", "rule", "code"], `#${alert.id}`);

export const alertMessage = (alert: RiskAlert) =>
  str(alert, ["message", "description", "details", "summary"]);

/**
 * The AI's words on an alert — on the alert itself once explained, or on the
 * explain response. Absent when there is no key or the model declined.
 */
export function alertExplanation(source: unknown): string {
  const direct = str(source, ["explanation", "ai_explanation", "explanation_text"]);
  if (direct) return direct;
  const nested = (source as { explanation?: unknown } | null)?.explanation;
  return str(nested, ["text", "content", "message"]);
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatBytes(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** dd/MM/yyyy in both locales — these dates are stamps, not prose. */
export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** `yyyy-MM-dd` for a date input, whatever the server sent. */
export function toDateInput(iso?: string | null) {
  if (!iso) return "";
  return String(iso).slice(0, 10);
}
