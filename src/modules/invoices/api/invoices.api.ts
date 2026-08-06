import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Invoice,
  InvoiceStats,
  InvoicesResponse,
  InvoicesQueryParams,
  CreateInvoiceRequest,
} from "../types/invoices.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export const invoiceApi = {
  /**
   * The invoices index returns a **plain array**, not a paginator — unlike
   * `/payments`, which returns the usual `{ data, total, per_page }` envelope
   * even when empty. Callers here read `.data` / `.total` / `.last_page`, so a
   * bare array left the list permanently empty no matter how many invoices
   * existed.
   *
   * Normalised to the paginator shape so the page works with either, and keeps
   * working if the endpoint is switched to `paginate()` later.
   */
  getAll: async (role: string, params?: InvoicesQueryParams) => {
    const response = await apiClient.get<ApiResponse<InvoicesResponse | Invoice[]>>(
      `${getRolePrefix(role)}/invoices`,
      params as Record<string, unknown>
    );
    const payload = response.data as any;

    if (Array.isArray(payload)) {
      const perPage = Number(params?.per_page) || payload.length || 1;
      return {
        current_page: Number(params?.page) || 1,
        data: payload as Invoice[],
        total: payload.length,
        per_page: perPage,
        last_page: Math.max(Math.ceil(payload.length / perPage), 1),
      } as InvoicesResponse;
    }

    return payload as InvoicesResponse;
  },

  getSingle: async (role: string, id: string | number) => {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      `${getRolePrefix(role)}/invoices/${id}`
    );
    return response.data;
  },

  /**
   * `/invoices/stats` is unreachable for the same reason as the payments one:
   * `/invoices/{id}` is declared first, so "stats" is bound as an id and the
   * server answers `404 No query results for model [App\Models\Invoice] stats`.
   *
   * Derived from the list until the routes are reordered server-side.
   */
  getStats: async (role: string): Promise<InvoiceStats> => {
    try {
      const response = await apiClient.get<ApiResponse<InvoiceStats>>(
        `${getRolePrefix(role)}/invoices/stats`
      );
      if (response?.data) return response.data;
    } catch {
      // fall through to deriving them
    }

    const list = await invoiceApi.getAll(role, { page: 1 } as InvoicesQueryParams);
    const rows: Invoice[] = list?.data ?? [];
    const countBy = (...statuses: string[]) =>
      rows.filter((i) => statuses.includes(String(i?.status ?? "").toLowerCase())).length;

    return {
      total: Number(list?.total ?? rows.length) || 0,
      paid: countBy("paid"),
      pending: countBy("pending", "unpaid", "partially_paid"),
      overdue: countBy("overdue"),
      derived: true,
    };
  },

  create: async (role: string, data: CreateInvoiceRequest) => {
    const response = await apiClient.post<ApiResponse<Invoice>>(
      `${getRolePrefix(role)}/invoices`,
      data
    );
    return response.data;
  },

  update: async (role: string, id: string | number, data: Partial<CreateInvoiceRequest>) => {
    const response = await apiClient.put<ApiResponse<Invoice>>(
      `${getRolePrefix(role)}/invoices/${id}`,
      data
    );
    return response.data;
  },

  delete: async (role: string, id: string | number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/invoices/${id}`
    );
    return response.data;
  },

  getCompanyData: async (role: string, companyId?: string | number) => {
    const url = companyId
      ? `${getRolePrefix(role)}/company-data/${companyId}`
      : `${getRolePrefix(role)}/company-data`;
    const response = await apiClient.get<ApiResponse<{ clients: any[]; projects: any[]; currencies: any[] }>>(url);
    return response.data;
  },

  getProjectData: async (role: string, projectId: string | number) => {
    const response = await apiClient.get<ApiResponse<{ currency: any; budget: number; paid: number; remaining: number }>>(
      `${getRolePrefix(role)}/project-data/${projectId}`
    );
    return response.data;
  },

  getClientProjects: async (role: string, clientId: string | number) => {
    const response = await apiClient.get<ApiResponse<{ projects: any[] }>>(
      `${getRolePrefix(role)}/clients/${clientId}/projects`
    );
    return response.data;
  },
};