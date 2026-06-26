import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Employee, EmployeeStats, EmployeesQueryParams } from "../types/employees.types";

export const employeeApi = {
  getAll: async (role: string, params?: EmployeesQueryParams) => {
    const response = await apiClient.get(
      `${getRolePrefix(role)}/employees`,
      { params }
    );
    const payload = response.data;

    if (Array.isArray(payload)) {
      return { data: payload, meta: { total: payload.length } };
    }

    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: payload?.data?.length || payload?.total || 0 },
    };
  },

  getStats: async (role: string): Promise<EmployeeStats> => {
    const res = await employeeApi.getAll(role);
    const employees = res.data;
    return {
      total:      employees.length,
      active:     employees.filter((e: any) => e.status === "active").length || employees.length,
      onboarding: employees.filter((e: any) => e.status === "onboarding").length || 0,
    };
  },

  create: async (role: string, data: Partial<Employee>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/employees`, data);
    return response.data;
  },

  update: async (role: string, id: number | string, data: Partial<Employee>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/employees/${id}`, data);
    return response.data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/employees/${id}`);
    return response.data;
  },

  getCompanyData: async (role: string, companyId?: string | number) => {
    const url = companyId
      ? `${getRolePrefix(role)}/company-data/${companyId}`
      : `${getRolePrefix(role)}/company-data`;
    const response = await apiClient.get(url);
    return response.data;
  },

  getCompanyCurrencies: async (role: string, companyId?: string | number) => {
    if (role === "super_admin" && !companyId) return { data: [] };
    const url =
      role === "super_admin"
        ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
        : `${getRolePrefix(role)}/currencies`;
    try {
      const response = await apiClient.get(url);
      return response.data;
    } catch {
      return { data: [] };
    }
  },
};