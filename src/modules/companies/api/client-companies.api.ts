import apiClient from "@/services/apiClient";
import type { Company } from "@/modules/companies/types/companies.types";

export type ClientCompany = Company & {
  clients: Array<{
    pivot: {
      status: "pending" | "active" | "rejected";
    };
  }>;
};

export type ApiClientCompaniesResponse = {
  data: ClientCompany[];
};

export const clientCompanyApi = {
  // Get available companies for the client
  getAll: (params?: { search?: string; page?: number }) =>
    apiClient.get<ApiClientCompaniesResponse>("/client/companies", params as Record<string, unknown>),

  // Send a join request
  requestJoin: (companyId: number) =>
    apiClient.post<{ message: string }>(`/client/companies/${companyId}/join`),
};
