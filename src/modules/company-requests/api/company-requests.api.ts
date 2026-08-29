import apiClient from "@/services/apiClient";
import type {
  JoinRequestClient,
  JoinRequestsApiResponse,
  JoinRequestsQueryParams,
  JoinRequestStats,
} from "../types/company-requests.types";

import { getRolePrefix } from "@/utils/rolePrefix";

// الـ backend بيعرف الـ role من الـ token تلقائياً
// super_admin  → /super_admin/requests
// company → /company/requests
// بس بنحتاج الـ role لـ approve/reject بعد ما بيرجع من أول response
const getBasePath = (role: string) =>
  `${getRolePrefix(role)}/requests`;

/**
 * The clients array out of whatever envelope the list endpoint used.
 *
 * Every other list module in the app unwraps a Laravel paginator
 * (`{ data: { data: [...] } }`), while this one was written expecting a bare
 * `{ data: [...] }`. Reading either — plus a raw array — means a change of
 * envelope on the backend stops silently emptying the table.
 */
export function unwrapClients(body: unknown): JoinRequestClient[] {
  if (Array.isArray(body)) return body as JoinRequestClient[];
  const payload = (body as { data?: unknown } | null)?.data;
  if (Array.isArray(payload)) return payload as JoinRequestClient[];
  const nested = (payload as { data?: unknown } | null)?.data;
  if (Array.isArray(nested)) return nested as JoinRequestClient[];
  return [];
}

export const joinRequestApi = {
  // ─── GET — بدون role، الـ backend بيختار الـ endpoint من الـ token ──────────
  getAll: (role: string, params?: JoinRequestsQueryParams) =>
    apiClient.get<JoinRequestsApiResponse>(
      getBasePath(role),
      params as Record<string, unknown>
    ),

  getStats: async (role = "super_admin") => {
    try {
      return await apiClient.get<JoinRequestStats>(`${getBasePath(role)}/stats`);
    } catch (error: any) {
      // The backend currently returns 404 for /requests/stats. Derive the same
      // counters from the working list endpoint until the backend route exists.
      if (error?.response?.status !== 404) throw error;
      const response = await joinRequestApi.getAll(role);
      const clients = Array.isArray((response as any)?.data) ? (response as any).data : [];
      const statuses = clients.flatMap((client: any) =>
        Array.isArray(client.companies)
          ? client.companies.map((company: any) => company?.pivot?.status)
          : []
      );
      return {
        total: statuses.length,
        pending: statuses.filter((status: string) => status === "pending").length,
        approved: statuses.filter((status: string) => status === "approved").length,
        rejected: statuses.filter((status: string) => status === "rejected").length,
      };
    }
  },

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