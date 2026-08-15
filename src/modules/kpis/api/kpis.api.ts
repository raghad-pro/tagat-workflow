import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  KpiDashboardData,
  KpiFiltersResponse,
  KpiTrends,
  KpiQueryParams,
} from "../types/kpis.types";

export const kpisApi = {
  getDashboard: async (role: string, params?: KpiQueryParams): Promise<KpiDashboardData> => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<any>(`${prefix}/kpis`, params as Record<string, unknown>);
    return (response as any)?.data ?? response;
  },

  getFilters: async (role: string): Promise<KpiFiltersResponse> => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<any>(`${prefix}/kpis/filters`);
    return (response as any)?.data ?? response;
  },

  getTrends: async (role: string, year?: number): Promise<KpiTrends> => {
    const prefix = getRolePrefix(role);
    const response = await apiClient.get<any>(`${prefix}/kpis/trends`, { year });
    return (response as any)?.data ?? response;
  },
};
