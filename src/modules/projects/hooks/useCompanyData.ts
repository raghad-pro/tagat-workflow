"use client";

import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { useAuth } from "@/providers/AuthProvider";
import { getRolePrefix } from "@/utils/rolePrefix";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyClient {
  id: number;
  name: string;
  [key: string]: any;
}

export interface CompanyCurrency {
  id: number;
  name: string;
  code?: string;
  symbol?: string;
  [key: string]: any;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export const useCompanyDataInfo = (companyId: string | number | undefined | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["company-data-info", companyId],
    queryFn: async () => {
      const url = companyId
        ? `${getRolePrefix(role)}/company-data/${companyId}`
        : `${getRolePrefix(role)}/company-data`;
      const response = await apiClient.get(url) as any;
      return response.data;
    },
    enabled: role === "company" || !!companyId,
  });
};

/**
 * Returns clients that belong to the selected company.
 *
 * Sourced from `/{role}/clients` rather than `/{role}/company-data/{id}`: that
 * endpoint is unusable on the server — it 500s for super_admin
 * ("Cannot redeclare InvoiceController::clientProjects()") and does not exist
 * at all for the company role — which left the Client dropdown permanently
 * showing "No clients" and blocked project creation entirely.
 *
 * For super_admin the list is narrowed to the chosen company via each client's
 * `companies[]` relation; a company admin already receives a scoped list.
 */
export const useCompanyClients = (companyId: string | number | undefined | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const isCompanyAdmin = role === "company";

  const query = useQuery<CompanyClient[]>({
    queryKey: ["company-clients", role, companyId],
    queryFn: async () => {
      const response = (await apiClient.get(
        `${getRolePrefix(role)}/clients`,
        { per_page: 200 }
      )) as any;

      const payload = response?.data ?? response;
      const list: any[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      if (isCompanyAdmin || !companyId) return list;

      return list.filter((c: any) =>
        Array.isArray(c?.companies)
          ? c.companies.some((co: any) => String(co?.id) === String(companyId))
          : String(c?.company_id ?? "") === String(companyId)
      );
    },
    enabled: isCompanyAdmin || !!companyId,
  });

  return { ...query, data: query.data ?? [] };
};

/**
 * Returns employees that belong to the selected company.
 */
export const useCompanyEmployees = (companyId: string | number | undefined | null) => {
  const query = useCompanyDataInfo(companyId);
  return { 
    ...query, 
    data: query.data?.data?.employees || query.data?.employees || [] 
  };
};

/**
 * GET /{role}/companies/{companyId}/currencies
 * Returns currencies assigned to the selected company.
 * Response shape: { data: [...] }
 */
export const useCompanyCurrenciesByCompany = (
  companyId: string | number | undefined | null
) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery<CompanyCurrency[]>({
    queryKey: ["company-currencies", role, companyId],
    queryFn: async () => {
      if (role === "super_admin" && !companyId) return [];
      const url =
        role === "super_admin"
          ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
          : `${getRolePrefix(role)}/currencies`;
      try {
        const response = (await apiClient.get(url)) as any;
        const payload = response.data;

        let currencies = [];
        if (Array.isArray(payload?.data?.data)) {
          currencies = payload.data.data;
        } else if (Array.isArray(payload?.data)) {
          currencies = payload.data;
        } else if (Array.isArray(payload)) {
          currencies = payload;
        }
        return currencies;
      } catch {
        return [];
      }
    },
    enabled: role === "company" || !!companyId,
  });
};

/**
 * GET /{role}/clients/{clientId}/projects
 * Returns projects assigned to the selected client.
 */
export const useClientProjects = (clientId: string | number | undefined | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["client-projects", role, clientId],
    queryFn: async () => {
      const url = `${getRolePrefix(role)}/clients/${clientId}/projects`;
      const response = await apiClient.get(url) as any;
      return response?.projects || response?.data?.projects || response?.data?.data?.projects || [];
    },
    enabled: !!clientId,
  });
};

/**
 * GET /{role}/project-data/{projectId}
 * Returns project data including currency, budget, etc.
 */
export const useProjectData = (projectId: string | number | undefined | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["project-data", role, projectId],
    queryFn: async () => {
      const url = `${getRolePrefix(role)}/project-data/${projectId}`;
      const response = await apiClient.get(url) as any;
      return response.data?.data || response.data;
    },
    enabled: !!projectId,
  });
};