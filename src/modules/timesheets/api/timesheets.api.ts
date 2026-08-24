import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface TimesheetQueryParams {
  page?:   number;
  month?:  string;
  status?: string;
  search?: string;
}

export interface TimesheetSummary {
  total_formatted?: string;
  total_hours?: number;
  total_minutes?: number;
  paid_count?: number;
  unpaid_count?: number;
  paid_total?: number | string;
  unpaid_total?: number | string;
  totals_by_currency?: Record<string, { paid: number; unpaid: number; total: number }>;
}

export const timesheetsApi = {
  /**
   * The list wraps its paginator one level deeper than the other modules:
   * `data` is `{ timesheets: { data: [...] }, summary, available_months }`, not
   * the paginator itself. Reading `data.data` therefore found nothing and this
   * screen rendered an empty table for every account — the array is under
   * `data.timesheets.data`.
   */
  getAll: async (role: string, params?: TimesheetQueryParams) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/timesheets`,
      params as Record<string, unknown>
    );
    const responseData = response?.data;

    const empty = { data: [] as any[], total: 0, summary: {} as TimesheetSummary };

    if (!responseData) return empty;
    if (Array.isArray(responseData)) {
      return { ...empty, data: responseData, total: responseData.length };
    }

    const summary: TimesheetSummary = responseData.summary ?? {};
    // Current envelope first, then the flat paginator older responses used.
    const paginator = responseData.timesheets ?? responseData;
    const rows = Array.isArray(paginator)
      ? paginator
      : Array.isArray(paginator?.data)
        ? paginator.data
        : [];

    return {
      data: rows,
      total: Number(paginator?.total ?? rows.length) || rows.length,
      summary,
    };
  },

  getSingle: async (role: string, id: number) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/timesheets/${id}`
    );
    return response.data;
  },

  approve: async (role: string, id: number) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}/approve`
    );
    return response.data;
  },

  reject: async (role: string, id: number) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}/reject`
    );
    return response.data;
  },

  delete: async (role: string, id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}`
    );
    return response.data;
  },
};