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
  getAll: async (role: string, params?: InvoicesQueryParams) => {
    const response = await apiClient.get<ApiResponse<InvoicesResponse>>(
      `${getRolePrefix(role)}/invoices`,
      params as Record<string, unknown>
    );
    return response.data;
  },

  getSingle: async (role: string, id: string | number) => {
    const response = await apiClient.get<ApiResponse<Invoice>>(
      `${getRolePrefix(role)}/invoices/${id}`
    );
    return response.data;
  },

  getStats: async (role: string) => {
    const response = await apiClient.get<ApiResponse<InvoiceStats>>(
      `${getRolePrefix(role)}/invoices/stats`
    );
    return response.data;
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