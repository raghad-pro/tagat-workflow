import type { Role, RoleStats, RolesQueryParams } from "../types/roles.types";
import apiClient from "@/services/apiClient";

export const roleApi = {
  getAll: async (params?: RolesQueryParams) => {
    // Pass params inside the Axios config object
    const response = await apiClient.get('/api/v1/super_admin/roles', { params });
    
    // response.data contains the actual payload
    const payload = response.data;
    
    // Fallback if API returns an array directly instead of { data, meta }
    if (Array.isArray(payload)) {
      return { data: payload, meta: { total: payload.length } };
    }
    
    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: payload?.data?.length || 0 }
    };
  },

  getStats: async (): Promise<RoleStats> => {
    // Since there is no dedicated stats endpoint, we fetch all roles to compute stats
    // In a real scenario, this should be handled by a dedicated backend endpoint if data is large.
    const res = await roleApi.getAll();
    const roles = res.data;
    
    return {
      total: roles.length,
      systemRoles: roles.filter(r => r.type === 'system').length,
      customRoles: roles.filter(r => r.type === 'custom').length
    };
  },

  create: async (data: Partial<Role>) => {
    const response = await apiClient.post('/api/v1/super_admin/roles', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<Role>) => {
    const response = await apiClient.put(`/api/v1/super_admin/roles/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await apiClient.delete(`/api/v1/super_admin/roles/${id}`);
    return response.data;
  }
};
