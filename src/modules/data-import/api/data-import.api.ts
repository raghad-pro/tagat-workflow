import apiClient from "@/services/apiClient";
import axiosInstance from "@/services/axiosConfig";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  AuditRow,
  CommitResult,
  CsvDelimiter,
  DataImportFile,
  DataImportSession,
  Id,
  PreviewRow,
  RollbackEligibility,
  SessionPreviewSummary,
  SheetMapping,
  SheetPreview,
  UpdateMappingPayload,
} from "../types/data-import.types";
import { unwrap, unwrapList } from "../utils/shape";

/**
 * Data import — v3.
 *
 * Three route families, all under the caller's role prefix:
 *   {prefix}/dataImports/…       the session
 *   {prefix}/dataImportFiles/…   one uploaded file
 *   {prefix}/dataImportSheets/…  one sheet inside a file
 *
 * The order the routes are meant to be called in is the wizard's six steps:
 * create → upload → parse → analyze/mapping → preview → commit, then audit.
 */
const sessions = (role: string) => `${getRolePrefix(role)}/dataImports`;
const files = (role: string) => `${getRolePrefix(role)}/dataImportFiles`;
const sheets = (role: string) => `${getRolePrefix(role)}/dataImportSheets`;

/**
 * Uploads get their own timeout.
 *
 * The shared instance is capped at 15s, which ten spreadsheets on a slow
 * connection will exceed — and a timeout mid-upload leaves the session holding
 * a partial set of files.
 */
const UPLOAD_TIMEOUT_MS = 120_000;

export const dataImportApi = {
  // ─── Sessions ───────────────────────────────────────────────────────────────

  /** A super admin must name the company; a company admin's own is implied. */
  createSession: async (role: string, targetCompanyId?: Id) => {
    const body = targetCompanyId ? { target_company_id: targetCompanyId } : {};
    const response = await apiClient.post<unknown>(sessions(role), body);
    return unwrap<DataImportSession>(response);
  },

  listSessions: async (role: string, params?: Record<string, unknown>) => {
    const response = await apiClient.get<unknown>(sessions(role), params);
    return unwrapList<DataImportSession>(response);
  },

  getSession: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/${id}`);
    return unwrap<DataImportSession>(response);
  },

  /** Committed sessions are kept for audit; the server decides what it allows. */
  deleteSession: (role: string, id: Id) =>
    apiClient.delete<unknown>(`${sessions(role)}/${id}`),

  // ─── Files ──────────────────────────────────────────────────────────────────

  /** Upload only. Parsing is a separate, explicit call. */
  uploadFiles: async (role: string, id: Id, list: File[]) => {
    const form = new FormData();
    for (const file of list) form.append("files[]", file);

    const response = await axiosInstance.post(`${sessions(role)}/${id}/files`, form, {
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return unwrapList<DataImportFile>(response.data);
  },

  listFiles: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/${id}/files`);
    return unwrapList<DataImportFile>(response);
  },

  getFile: async (role: string, fileId: Id) => {
    const response = await apiClient.get<unknown>(`${files(role)}/${fileId}`);
    return unwrap<DataImportFile>(response);
  },

  /** Synchronous parse — the sheets exist only after this returns. */
  parseFile: async (role: string, fileId: Id) => {
    const response = await apiClient.post<unknown>(`${files(role)}/${fileId}/parse`, {});
    return unwrap<DataImportFile>(response);
  },

  /** CSV only; re-parses the file, so the sheets come back rebuilt. */
  setDelimiter: async (role: string, fileId: Id, delimiter: CsvDelimiter) => {
    const response = await apiClient.put<unknown>(`${files(role)}/${fileId}/delimiter`, {
      delimiter,
    });
    return unwrap<DataImportFile>(response);
  },

  // ─── Mapping ────────────────────────────────────────────────────────────────

  /** Deterministic column matching — not the AI suggestion. */
  analyzeSheet: async (role: string, sheetId: Id, reset = false) => {
    const response = await apiClient.post<unknown>(
      `${sheets(role)}/${sheetId}/analyze`,
      reset ? { reset: true } : {}
    );
    return unwrap<SheetMapping>(response);
  },

  getMapping: async (role: string, sheetId: Id) => {
    const response = await apiClient.get<unknown>(`${sheets(role)}/${sheetId}/mapping`);
    return unwrap<SheetMapping>(response);
  },

  updateMapping: async (role: string, sheetId: Id, payload: UpdateMappingPayload) => {
    const response = await apiClient.put<unknown>(
      `${sheets(role)}/${sheetId}/mapping`,
      payload
    );
    return unwrap<SheetMapping>(response);
  },

  /** Optional. A suggestion only — it still has to be confirmed and saved. */
  aiSuggest: async (role: string, sheetId: Id) => {
    const response = await apiClient.post<unknown>(
      `${sheets(role)}/${sheetId}/ai-suggest`,
      {}
    );
    return unwrap<SheetMapping>(response);
  },

  // ─── Preview ────────────────────────────────────────────────────────────────

  /** Stages and validates. Creates no business records. */
  buildSheetPreview: async (role: string, sheetId: Id) => {
    const response = await apiClient.post<unknown>(
      `${sheets(role)}/${sheetId}/preview`,
      {}
    );
    return unwrap<SheetPreview>(response);
  },

  getSheetPreview: async (role: string, sheetId: Id) => {
    const response = await apiClient.get<unknown>(`${sheets(role)}/${sheetId}/preview`);
    return unwrap<SheetPreview>(response);
  },

  getPreviewRows: async (role: string, sheetId: Id, params?: Record<string, unknown>) => {
    const response = await apiClient.get<unknown>(`${sheets(role)}/${sheetId}/rows`, params);
    return unwrapList<PreviewRow>(response);
  },

  getSessionPreview: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/${id}/preview`);
    return unwrap<SessionPreviewSummary>(response);
  },

  // ─── Commit ─────────────────────────────────────────────────────────────────

  /** Creates real business data. Idempotent, so a retry cannot double-import. */
  commit: async (role: string, id: Id) => {
    const response = await apiClient.post<unknown>(`${sessions(role)}/${id}/commit`, {});
    return unwrap<CommitResult>(response);
  },

  getCommitResult: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/${id}/commit`);
    return unwrap<CommitResult>(response);
  },

  // ─── Audit & history ────────────────────────────────────────────────────────

  getHistory: async (role: string, params?: Record<string, unknown>) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/history`, params);
    return unwrapList<DataImportSession>(response);
  },

  getAudit: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(`${sessions(role)}/${id}/audit`);
    return unwrap<Record<string, unknown>>(response);
  },

  getAuditRows: async (role: string, id: Id, params?: Record<string, unknown>) => {
    const response = await apiClient.get<unknown>(
      `${sessions(role)}/${id}/audit/rows`,
      params
    );
    return unwrapList<AuditRow>(response);
  },

  /** Read-only analysis. There is no rollback route — this only reports. */
  getRollbackEligibility: async (role: string, id: Id) => {
    const response = await apiClient.get<unknown>(
      `${sessions(role)}/${id}/rollback-eligibility`
    );
    return unwrap<RollbackEligibility>(response);
  },
};
