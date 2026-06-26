import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Role, RoleStats, RolesQueryParams } from "../types/roles.types";

export const roleApi = {
  getAll: async (role: string, params?: RolesQueryParams) => {
    const response = await apiClient.get(
      `${getRolePrefix(role)}/roles`,
      { params }
    );
    const payload = response.data;

    if (Array.isArray(payload)) {
      return { data: payload, meta: { total: payload.length } };
    }

    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: payload?.data?.length || 0 },
    };
  },

  getStats: async (role: string): Promise<RoleStats> => {
    const res   = await roleApi.getAll(role);
    const roles = res.data;
    return {
      total:       roles.length,
      systemRoles: roles.filter((r: any) => r.type === "system").length,
      customRoles: roles.filter((r: any) => r.type === "custom").length,
    };
  },

  create: async (role: string, data: Partial<Role>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/roles`, data);
    return response.data;
  },

  update: async (role: string, id: number | string, data: Partial<Role>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/roles/${id}`, data);
    return response.data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/roles/${id}`);
    return response.data;
  },
};