import type { Project, ProjectStats, ProjectsQueryParams } from "../types/projects.types";
import apiClient from "@/services/apiClient";

export const projectApi = {
  getAll: async (params?: ProjectsQueryParams) => {
    const response = await apiClient.get('/api/v1/super_admin/projects', { params });
    const payload = response.data;
    
    if (Array.isArray(payload)) {
      return { data: payload, total: payload.length };
    }
    
    return {
      data: payload?.data || [],
      total: payload?.meta?.total || payload?.total || payload?.data?.length || 0
    };
  },

  getStats: async (): Promise<ProjectStats> => {
    // Computing stats from getAll since there's no dedicated endpoint
    const res = await projectApi.getAll();
    const projects = res.data;
    
    const completedCount = projects.filter(p => p.status === 'completed').length;
    const inProgressCount = projects.filter(p => p.status === 'in_progress').length;

    return {
      totalProjects: { value: projects.length, label: "Total Projects" },
      inProgress: { value: inProgressCount, label: "In Progress" },
      completed: { value: completedCount, label: "Completed" }
    };
  },

  create: async (data: Partial<Project>) => {
    const response = await apiClient.post('/api/v1/super_admin/projects', data);
    return response.data;
  },

  update: async (id: number | string, data: Partial<Project>) => {
    const response = await apiClient.put(`/api/v1/super_admin/projects/${id}`, data);
    return response.data;
  },

  delete: async (id: number | string) => {
    const response = await apiClient.delete(`/api/v1/super_admin/projects/${id}`);
    return response.data;
  }
};
