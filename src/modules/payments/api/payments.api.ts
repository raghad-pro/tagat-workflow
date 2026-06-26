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
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments`,
      { params }
    );
    return response.data;
  },

  getSingle: async (role: string, id: string | number) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/payments/${id}`
    );
    return response.data;
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
      `${getRolePrefix(role)}/${invoiceId}/pay`,
      { payment_gateway: gateway }
    );
    return response.data;
  },
};