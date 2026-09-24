"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { projectAiApi } from "../api/project-ai.api";
import type {
  AiScope,
  AlertsParams,
  Id,
  ReviewPlanPayload,
} from "../types/project-ai.types";
import { errorMessage, str } from "../utils/shape";

/**
 * Every Project AI query and mutation.
 *
 * All routes are role-prefixed and project-scoped, so each one waits for a
 * resolved scope — firing early would ask on behalf of the wrong role, or (for
 * a super admin) without the project's company.
 */
const KEY = "project-ai";

export const failed = (error: unknown) =>
  toast.error(errorMessage(error), { style: { background: "#F92929", color: "#fff" } });

const scopeKey = (scope: AiScope | undefined) =>
  scope ? [scope.role, String(scope.projectId), String(scope.companyId ?? "")] : [];

/**
 * The scope for one project: the caller's role, and — for a super admin — the
 * project's company, read from the project itself. `undefined` until both are
 * known, so nothing fires half-addressed.
 */
export function useProjectAiScope(projectId: Id | undefined) {
  const { user } = useAuth();
  const role = user?.role as string | undefined;

  const project = useQuery({
    queryKey: [KEY, "project", role, projectId],
    queryFn: () => projectAiApi.getProject(role as string, projectId as Id),
    enabled: !!role && !!projectId,
  });

  const record = project.data;
  const companyId =
    str(record, ["company_id"]) ||
    str((record as { company?: unknown } | undefined)?.company, ["id"]);

  // A company admin's tenant is implied, so there is nothing to wait for. A
  // super admin waits for the project — unless it failed to load, in which case
  // the AI routes are still worth asking and will say why if they refuse.
  const ready =
    !!role && !!projectId && (role !== "super_admin" || project.isSuccess || project.isError);

  const scope: AiScope | undefined = ready
    ? { role: role as string, projectId: projectId as Id, companyId: companyId || undefined }
    : undefined;

  return { scope, project };
}

// ─── Documents ────────────────────────────────────────────────────────────────

export function useAiDocuments(scope: AiScope | undefined) {
  return useQuery({
    queryKey: [KEY, "documents", ...scopeKey(scope)],
    queryFn: () => projectAiApi.listDocuments(scope as AiScope),
    enabled: !!scope,
  });
}

/** Uploads one after another, so each failure names its own file. */
export function useUploadAiDocuments(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (files: File[]) => {
      let uploaded = 0;
      for (const file of files) {
        try {
          await projectAiApi.uploadDocument(scope as AiScope, file);
          uploaded += 1;
        } catch (error) {
          toast.error(`${file.name} — ${errorMessage(error)}`, {
            style: { background: "#F92929", color: "#fff" },
            duration: 8000,
          });
        }
      }
      return uploaded;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: [KEY, "documents"] }),
  });
}

export function useDeleteAiDocument(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: Id) => projectAiApi.deleteDocument(scope as AiScope, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "documents"] }),
    onError: failed,
  });
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export function useAiPlans(scope: AiScope | undefined) {
  return useQuery({
    queryKey: [KEY, "plans", ...scopeKey(scope)],
    queryFn: () => projectAiApi.listPlans(scope as AiScope),
    enabled: !!scope,
  });
}

export function useAiPlan(scope: AiScope | undefined, planId: Id | undefined) {
  return useQuery({
    queryKey: [KEY, "plan", ...scopeKey(scope), String(planId ?? "")],
    queryFn: () => projectAiApi.getPlan(scope as AiScope, planId as Id),
    enabled: !!scope && planId !== undefined && planId !== "",
  });
}

export function useGenerateAiPlan(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectAiApi.generatePlan(scope as AiScope),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "plans"] }),
    onError: failed,
  });
}

export function useReviewAiPlan(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, payload }: { planId: Id; payload: ReviewPlanPayload }) =>
      projectAiApi.reviewPlan(scope as AiScope, planId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY, "plan"] });
      queryClient.invalidateQueries({ queryKey: [KEY, "plans"] });
    },
    onError: failed,
  });
}

/**
 * Approval creates real sprints and tasks, so everything that lists them is
 * stale afterwards. Errors are left to the caller: a refusal asking for
 * `confirm_additional_plan` is a question, not a failure.
 */
export function useApproveAiPlan(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ planId, confirmAdditional }: { planId: Id; confirmAdditional?: boolean }) =>
      projectAiApi.approvePlan(scope as AiScope, planId, confirmAdditional),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// ─── Risk alerts ──────────────────────────────────────────────────────────────

export function useAiAlerts(scope: AiScope | undefined, params: AlertsParams) {
  return useQuery({
    queryKey: [KEY, "alerts", ...scopeKey(scope), params],
    queryFn: () => projectAiApi.listAlerts(scope as AiScope, params),
    enabled: !!scope,
    placeholderData: keepPreviousData,
  });
}

export function useRefreshAiAlerts(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => projectAiApi.refreshAlerts(scope as AiScope),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "alerts"] }),
    onError: failed,
  });
}

export function useAcknowledgeAiAlert(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: Id) => projectAiApi.acknowledgeAlert(scope as AiScope, alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "alerts"] }),
    onError: failed,
  });
}

export function useExplainAiAlert(scope: AiScope | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: Id) => projectAiApi.explainAlert(scope as AiScope, alertId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "alerts"] }),
    onError: failed,
  });
}
