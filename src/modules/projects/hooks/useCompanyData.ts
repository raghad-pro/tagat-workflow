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
      const response = await apiClient.get(url);
      return response.data;
    },
    enabled: !!companyId,
  });
};

/**
 * Returns clients that belong to the selected company.
 */
export const useCompanyClients = (companyId: string | number | undefined | null) => {
  const query = useCompanyDataInfo(companyId);
  return { 
    ...query, 
    data: query.data?.data?.clients || query.data?.clients || [] 
  };
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
      const response = await apiClient.get(url);
      return response.data?.projects || response.data?.data?.projects || [];
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
      const response = await apiClient.get(url);
      return response.data?.data || response.data;
    },
    enabled: !!projectId,
  });
};