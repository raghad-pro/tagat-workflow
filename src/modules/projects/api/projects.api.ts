import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Project, ProjectStats, ProjectsQueryParams } from "../types/projects.types";

export const projectApi = {
  getAll: async (role: string, params?: ProjectsQueryParams) => {
    const response = await apiClient.get(
      `${getRolePrefix(role)}/projects`,
      { params }
    ) as any;
    const payload = response.data;

    if (Array.isArray(payload)) {
      return { data: payload, total: payload.length };
    }

    return {
      data:  payload?.data || [],
      total: payload?.meta?.total || payload?.total || payload?.data?.length || 0,
    };
  },

  getStats: async (role: string): Promise<ProjectStats> => {
    const res      = await projectApi.getAll(role);
    const projects = res.data;
    return {
      totalProjects: { value: projects.length,                                              label: "Total Projects" },
      inProgress:    { value: projects.filter((p: any) => p.status === "in_progress").length, label: "In Progress"    },
      completed:     { value: projects.filter((p: any) => p.status === "completed").length,   label: "Completed"      },
    };
  },

  create: async (role: string, data: Partial<Project>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/projects`, data) as any;
    return response.data;
  },

  update: async (role: string, id: number | string, data: Partial<Project>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/projects/${id}`, data) as any;
    return response.data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/projects/${id}`) as any;
    return response.data;
  },
};