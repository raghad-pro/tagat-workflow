import apiClient from "@/services/apiClient";
import type {
  Company,
  CompanyStats,
  CompaniesQueryParams,
  AddCompanyRequest,
} from "@/modules/companies/types/companies.types";

// ─── Raw API response shape ───────────────────────────────────────────────────
export type ApiCompaniesResponse = {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Array<{
      id: number;
      name: string;
      email: string;
      domain: string;
      logo: string | null;
      created_at: string;
      updated_at: string;
    }>;
    total: number;
    per_page: number;
    last_page: number;
  };
};

export const companyApi = {
  // ─── GET /super_admin/companies ───────────────────────────────────────────
  getAll: (params?: CompaniesQueryParams) =>
    apiClient.get<ApiCompaniesResponse>("/super_admin/companies", params as Record<string, unknown>),

  // ─── GET /super_admin/companies/stats ─────────────────────────────────────
  getStats: () =>
    apiClient.get<CompanyStats>("/super_admin/companies/stats"),

  // ─── POST /super_admin/companies ──────────────────────────────────────────
  create: (data: AddCompanyRequest) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("domain", data.domain);
    formData.append("fieldOfWork", data.fieldOfWork);
    if (data.logo) {
      formData.append("logo", data.logo);
    }
    return apiClient.post<{ success: boolean; data: Company }>("/super_admin/companies", formData);
  },

  // ─── DELETE /super_admin/companies/:id ────────────────────────────────────
  delete: (id: number) =>
    apiClient.delete<void>(`/super_admin/companies/${id}`),

  // ─── PUT /super_admin/companies/:id ───────────────────────────────────────
  update: (id: number, data: Partial<AddCompanyRequest>) => {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.email) formData.append("email", data.email);
    if (data.domain) formData.append("domain", data.domain);
    if (data.fieldOfWork) formData.append("fieldOfWork", data.fieldOfWork);
    if (data.logo) {
      formData.append("logo", data.logo);
    }
    // Laravel requires _method=PUT when sending FormData to a PUT route
    formData.append("_method", "PUT");
    return apiClient.post<{ success: boolean; data: Company }>(`/super_admin/companies/${id}`, formData);
  },
};