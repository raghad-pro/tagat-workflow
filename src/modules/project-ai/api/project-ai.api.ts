import type { AxiosRequestConfig } from "axios";
import axiosInstance from "@/services/axiosConfig";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  AiDocument,
  AiPlan,
  AiScope,
  AlertsParams,
  Id,
  ReviewPlanPayload,
  RiskAlert,
} from "../types/project-ai.types";
import { unwrap, unwrapList, unwrapPage } from "../utils/shape";

/**
 * Project AI — `{prefix}/projects/{project}/ai/…`, for `super_admin` and
 * `company` only.
 *
 * The flow the routes are built around:
 *   requirement documents → generate a plan SUGGESTION → the manager reviews it
 *   → approve (the only call that writes real sprints and tasks)
 *   → deterministic risk alerts, with an optional AI explanation.
 *
 * The AI never decides anything, and every route works without a Gemini key —
 * generation answers 409 with an `ai_outcome` when it cannot produce a plan.
 *
 * Permissions: `project_ai.view` reads, `.create` uploads / generates /
 * explains, `.manage` deletes / reviews / refreshes / acknowledges, `.approve`
 * approves.
 */
const base = (scope: AiScope) =>
  `${getRolePrefix(scope.role)}/projects/${scope.projectId}/ai`;

/**
 * Generation and explanation may wait on the model, and an upload on the
 * connection — the shared instance's timeout is too short for either.
 */
const SLOW_TIMEOUT_MS = 120_000;

/** A super admin names the project's company; everyone else's is implied. */
function config(scope: AiScope, extra?: AxiosRequestConfig): AxiosRequestConfig {
  const headers =
    scope.role === "super_admin" && scope.companyId !== undefined && scope.companyId !== ""
      ? { "X-Company": String(scope.companyId) }
      : undefined;
  return { ...extra, headers: { ...headers, ...extra?.headers } };
}

export const projectAiApi = {
  /** The project itself — for its name, company and members. */
  getProject: async (role: string, projectId: Id) => {
    const response = await axiosInstance.get(`${getRolePrefix(role)}/projects/${projectId}`);
    return unwrap<Record<string, unknown>>(response.data);
  },

  // ─── Requirement documents ──────────────────────────────────────────────────

  listDocuments: async (scope: AiScope) => {
    const response = await axiosInstance.get(`${base(scope)}/documents`, config(scope));
    return unwrapList<AiDocument>(response.data);
  },

  /** One file per call — the route validates a single `document`. */
  uploadDocument: async (scope: AiScope, file: File) => {
    const form = new FormData();
    form.append("document", file);
    const response = await axiosInstance.post(
      `${base(scope)}/documents`,
      form,
      config(scope, { timeout: SLOW_TIMEOUT_MS })
    );
    return unwrap<AiDocument>(response.data);
  },

  deleteDocument: async (scope: AiScope, documentId: Id) => {
    await axiosInstance.delete(`${base(scope)}/documents/${documentId}`, config(scope));
  },

  // ─── Plans ──────────────────────────────────────────────────────────────────

  listPlans: async (scope: AiScope) => {
    const response = await axiosInstance.get(`${base(scope)}/plans`, config(scope));
    return unwrapList<AiPlan>(response.data);
  },

  getPlan: async (scope: AiScope, planId: Id) => {
    const response = await axiosInstance.get(`${base(scope)}/plans/${planId}`, config(scope));
    return unwrap<AiPlan>(response.data);
  },

  /** Takes no body. Writes a suggestion only — nothing reaches sprints/tasks. */
  generatePlan: async (scope: AiScope) => {
    const response = await axiosInstance.post(
      `${base(scope)}/plans`,
      undefined,
      config(scope, { timeout: SLOW_TIMEOUT_MS })
    );
    return unwrap<AiPlan>(response.data);
  },

  /** Only the fields that changed; ids are the suggestion ids. */
  reviewPlan: async (scope: AiScope, planId: Id, payload: ReviewPlanPayload) => {
    const response = await axiosInstance.patch(
      `${base(scope)}/plans/${planId}/review`,
      payload,
      config(scope)
    );
    return unwrap<AiPlan>(response.data);
  },

  /**
   * Creates the real Sprint and Task rows. `confirm_additional_plan` is the
   * explicit yes the server wants before a second plan lands on a project that
   * already has one.
   */
  approvePlan: async (scope: AiScope, planId: Id, confirmAdditional = false) => {
    const response = await axiosInstance.post(
      `${base(scope)}/plans/${planId}/approve`,
      { confirm_additional_plan: confirmAdditional },
      config(scope)
    );
    return unwrap<AiPlan>(response.data);
  },

  // ─── Risk alerts ────────────────────────────────────────────────────────────

  listAlerts: async (scope: AiScope, params?: AlertsParams) => {
    const response = await axiosInstance.get(
      `${base(scope)}/alerts`,
      config(scope, { params })
    );
    return unwrapPage<RiskAlert>(response.data);
  },

  /** Re-runs the deterministic checks. No AI involved. */
  refreshAlerts: async (scope: AiScope) => {
    const response = await axiosInstance.post(
      `${base(scope)}/alerts/refresh`,
      undefined,
      config(scope)
    );
    return unwrap<unknown>(response.data);
  },

  acknowledgeAlert: async (scope: AiScope, alertId: Id) => {
    const response = await axiosInstance.post(
      `${base(scope)}/alerts/${alertId}/acknowledge`,
      undefined,
      config(scope)
    );
    return unwrap<RiskAlert>(response.data);
  },

  /** The one Gemini-aware call; degrades to a plain answer without a key. */
  explainAlert: async (scope: AiScope, alertId: Id) => {
    const response = await axiosInstance.post(
      `${base(scope)}/alerts/${alertId}/explain`,
      undefined,
      config(scope, { timeout: SLOW_TIMEOUT_MS })
    );
    return unwrap<unknown>(response.data);
  },
};
