"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";
import { dataImportApi } from "../api/data-import.api";
import type {
  CsvDelimiter,
  Id,
  UpdateMappingPayload,
} from "../types/data-import.types";

/**
 * Every data-import query and mutation.
 *
 * All routes are role-prefixed, so each one waits for the session's role to
 * resolve — firing early would ask `/super_admin/…` on behalf of a company user
 * and then throw the answer away under a different key.
 */
const KEY = "data-imports";

function useRole() {
  const { user } = useAuth();
  return user?.role as string | undefined;
}

const failed = (error: unknown) =>
  toast.error((error as { message?: string })?.message || "Request failed", {
    style: { background: "#F92929", color: "#fff" },
  });

// ─── Sessions ─────────────────────────────────────────────────────────────────

export function useImportSessions() {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "list", role],
    queryFn: () => dataImportApi.listSessions(role as string),
    enabled: !!role,
  });
}

export function useImportSession(id: Id | undefined) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "session", role, id],
    queryFn: () => dataImportApi.getSession(role as string, id as Id),
    enabled: !!role && !!id,
  });
}

export function useCreateImportSession() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetCompanyId?: Id) =>
      dataImportApi.createSession(role as string, targetCompanyId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

export function useDeleteImportSession() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: Id) => dataImportApi.deleteSession(role as string, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

// ─── Files ────────────────────────────────────────────────────────────────────

export function useImportFiles(id: Id | undefined) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "files", role, id],
    queryFn: () => dataImportApi.listFiles(role as string, id as Id),
    enabled: !!role && !!id,
  });
}

/**
 * Upload, then parse each file that came back.
 *
 * The routes are deliberately separate — upload does not parse — but there is
 * no point in the UI showing an unparsed file, so the two are one action here.
 * A file that fails to parse is left in place with its error rather than
 * failing the whole upload.
 */
export function useUploadFiles(id: Id | undefined) {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: File[]) => {
      await dataImportApi.uploadFiles(role as string, id as Id, list);

      // Parse against the file list rather than the upload's own response: the
      // upload's shape is undocumented, and an id read wrongly from it would
      // send every parse to a URL that cannot exist. The list route's ids are
      // the same ones the next screen acts on.
      const uploaded = (await dataImportApi.listFiles(role as string, id as Id)).filter(
        (file) => !Array.isArray(file.sheets) || file.sheets.length === 0
      );

      const parses = await Promise.allSettled(
        uploaded.map((file) => dataImportApi.parseFile(role as string, file.id))
      );

      // A parse that fails must say so. Swallowing it leaves the next step
      // showing a file with no sheets and no reason — which is indistinguishable
      // from a file that was never parsed at all.
      parses.forEach((outcome, index) => {
        if (outcome.status !== "rejected") return;
        const name = uploaded[index]?.original_name ?? uploaded[index]?.name ?? "";
        const reason = (outcome.reason as { message?: string })?.message ?? "";
        toast.error([name, reason].filter(Boolean).join(" — "), {
          style: { background: "#F92929", color: "#fff" },
          duration: 8000,
        });
      });

      return uploaded;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

/**
 * One file on its own.
 *
 * The list route may summarise; the show route is where a parse failure's
 * reason is most likely to be, so a file with no sheets asks for it.
 */
export function useFileDetail(fileId: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "file", role, fileId],
    queryFn: () => dataImportApi.getFile(role as string, fileId as Id),
    enabled: !!role && !!fileId && enabled,
    retry: false,
  });
}

export function useParseFile(sessionId: Id | undefined) {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (fileId: Id) => dataImportApi.parseFile(role as string, fileId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [KEY, "files", role, sessionId] }),
    onError: failed,
  });
}

/** Changing the separator re-parses the file, so its sheets are rebuilt. */
export function useSetDelimiter(sessionId: Id | undefined) {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, delimiter }: { fileId: Id; delimiter: CsvDelimiter }) =>
      dataImportApi.setDelimiter(role as string, fileId, delimiter),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

// ─── Mapping ──────────────────────────────────────────────────────────────────

export function useSheetMapping(sheetId: Id | undefined) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "mapping", role, sheetId],
    queryFn: () => dataImportApi.getMapping(role as string, sheetId as Id),
    enabled: !!role && !!sheetId,
  });
}

export function useAnalyzeSheet() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sheetId, reset }: { sheetId: Id; reset?: boolean }) =>
      dataImportApi.analyzeSheet(role as string, sheetId, reset),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

export function useUpdateMapping() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sheetId, payload }: { sheetId: Id; payload: UpdateMappingPayload }) =>
      dataImportApi.updateMapping(role as string, sheetId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

/** A suggestion only — it lands in the mapping response for confirmation. */
export function useAiSuggest() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheetId: Id) => dataImportApi.aiSuggest(role as string, sheetId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY, "mapping"] }),
    onError: failed,
  });
}

// ─── Preview ──────────────────────────────────────────────────────────────────

export function useSheetPreview(sheetId: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "sheet-preview", role, sheetId],
    queryFn: () => dataImportApi.getSheetPreview(role as string, sheetId as Id),
    enabled: !!role && !!sheetId && enabled,
    retry: false,
  });
}

export function usePreviewRows(sheetId: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "rows", role, sheetId],
    queryFn: () => dataImportApi.getPreviewRows(role as string, sheetId as Id),
    enabled: !!role && !!sheetId && enabled,
    retry: false,
  });
}

export function useBuildPreview() {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sheetIds: Id[]) =>
      Promise.all(
        sheetIds.map((sheetId) => dataImportApi.buildSheetPreview(role as string, sheetId))
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

export function useSessionPreview(id: Id | undefined) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "session-preview", role, id],
    queryFn: () => dataImportApi.getSessionPreview(role as string, id as Id),
    enabled: !!role && !!id,
    retry: false,
  });
}

// ─── Commit ───────────────────────────────────────────────────────────────────

export function useCommitImport(id: Id | undefined) {
  const role = useRole();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dataImportApi.commit(role as string, id as Id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
    onError: failed,
  });
}

export function useCommitResult(id: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "commit", role, id],
    queryFn: () => dataImportApi.getCommitResult(role as string, id as Id),
    enabled: !!role && !!id && enabled,
    // A session that has not been committed has no result; that is an answer,
    // not a failure worth retrying.
    retry: false,
  });
}

// ─── Audit & history ──────────────────────────────────────────────────────────

export function useImportHistory(params?: Record<string, unknown>) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "history", role, params],
    queryFn: () => dataImportApi.getHistory(role as string, params),
    enabled: !!role,
  });
}

export function useRollbackEligibility(id: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "rollback", role, id],
    queryFn: () => dataImportApi.getRollbackEligibility(role as string, id as Id),
    enabled: !!role && !!id && enabled,
    retry: false,
  });
}

export function useAuditRows(id: Id | undefined, enabled = true) {
  const role = useRole();
  return useQuery({
    queryKey: [KEY, "audit-rows", role, id],
    queryFn: () => dataImportApi.getAuditRows(role as string, id as Id),
    enabled: !!role && !!id && enabled,
    retry: false,
  });
}
