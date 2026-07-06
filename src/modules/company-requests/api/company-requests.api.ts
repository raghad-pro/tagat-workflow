import apiClient from "@/services/apiClient";
import type {
  JoinRequestsApiResponse,
  JoinRequestsQueryParams,
  JoinRequestStats,
} from "../types/company-requests.types";

// الـ backend بيعرف الـ role من الـ token تلقائياً
// super_admin  → /super_admin/requests
// company → /company/requests
// بس بنحتاج الـ role لـ approve/reject بعد ما بيرجع من أول response
const getBasePath = (role: string) =>
  role === "super_admin" ? "/super_admin/requests" : "/company/requests";

export const joinRequestApi = {
  // ─── GET — بدون role، الـ backend بيختار الـ endpoint من الـ token ──────────
  getAll: (role: string, params?: JoinRequestsQueryParams) =>
    apiClient.get<JoinRequestsApiResponse>(
      getBasePath(role),
      params as Record<string, unknown>
    ),

  getStats: (role = "super_admin") =>
    apiClient.get<JoinRequestStats>(`${getBasePath(role)}/stats`),

  // ─── POST — محتاجين الـ role هون عشان نختار الـ endpoint الصح ───────────────
  approve: (role: string, clientId: number, companyId: number) =>
    apiClient.post<{ message: string }>(
      `${getBasePath(role)}/${clientId}/approve`,
      { company_id: companyId }
    ),

  reject: (role: string, clientId: number, companyId: number) =>
    apiClient.post<{ message: string }>(
      `${getBasePath(role)}/${clientId}/reject`,
      { company_id: companyId }
    ),
};