import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export const paymentApi = {
  getAll: async (role: string, params?: { search?: string; page?: number }) => {
    // `apiClient.get` wraps its second argument as axios `{ params }` itself —
    // passing `{ params }` produced `?params[search]=…`, which the server ignores.
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments`,
      params as Record<string, unknown>
    );
    return response.data;
  },

  getSingle: async (role: string, id: string | number) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments/${id}`
    );
    return response.data;
  },

  /**
   * `/payments/stats` is unreachable: the server declares `/payments/{id}`
   * ahead of it, so Laravel binds the literal "stats" as an id and answers
   * `404 No query results for model [App\Models\Payment] stats`.
   *
   * Until the routes are reordered server-side, the totals are derived from
   * the payments list — the alternative is three cards permanently reading
   * $0.00, which looks like real data and is worse than an approximation.
   */
  getStats: async (role: string) => {
    try {
      const response = await apiClient.get<ApiResponse<any>>(
        `${getRolePrefix(role)}/payments/stats`
      );
      if (response?.data) return response.data;
    } catch {
      // fall through to deriving them
    }

    const list = await paymentApi.getAll(role, { page: 1 });
    const rows: any[] = Array.isArray(list) ? list : (list?.data ?? []);
    const amount = (p: any) => Number(p?.amount ?? 0) || 0;
    const isPending = (p: any) =>
      String(p?.status ?? "").toLowerCase() === "pending";

    return {
      totalRevenue: rows.filter((p) => !isPending(p)).reduce((sum, p) => sum + amount(p), 0),
      pendingPayments: rows.filter(isPending).reduce((sum, p) => sum + amount(p), 0),
      // The list is one server page, so this counts what the API reports overall.
      transactionVolume: Number(list?.total ?? rows.length) || 0,
      derived: true,
    };
  },

  create: async (role: string, data: Record<string, any>) => {
    const response = await apiClient.post<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments`,
      data
    );
    return response.data;
  },

  update: async (role: string, id: string | number, data: Record<string, any>) => {
    const response = await apiClient.put<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments/${id}`,
      data
    );
    return response.data;
  },

  delete: async (role: string, id: string | number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/payments/${id}`
    );
    return response.data;
  },

  getCompanyData: async (role: string, companyId?: string | number) => {
    const url = companyId
      ? `${getRolePrefix(role)}/payments-data/${companyId}`
      : `${getRolePrefix(role)}/payments-data`;
    const response = await apiClient.get<ApiResponse<{ invoices: any[]; wallets: any[]; employees: any[] }>>(url);
    return response.data;
  },

  payInvoice: async (role: string, invoiceId: string | number, gateway: string) => {
    const response = await apiClient.post<ApiResponse<{ payment_url: string }>>(
      `${getRolePrefix(role)}/invoices/${invoiceId}/pay`,
      { payment_gateway: gateway }
    );
    return response.data;
  },
};