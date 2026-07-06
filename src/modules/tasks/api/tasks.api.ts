import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Task, TaskStats, TasksQueryParams } from "../types/tasks.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

interface PaginatedData<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
}

export const taskApi = {
  getAll: async (role: string, params?: TasksQueryParams) => {
    const response = await apiClient.get<ApiResponse<PaginatedData<Task> | Task[]>>(
      `${getRolePrefix(role)}/tasks`,
      { params } as any
    );
    const responseData = response.data;

    if (Array.isArray(responseData)) {
      return { data: responseData, total: responseData.length };
    }
    if (responseData && "data" in responseData) {
      return {
        data:  responseData.data,
        total: responseData.total || responseData.data.length,
      };
    }
    return { data: [], total: 0 };
  },

  getSingle: async (role: string, id: number) => {
    const response = await apiClient.get<ApiResponse<Task>>(
      `${getRolePrefix(role)}/tasks/${id}`
    );
    return response.data;
  },

  create: async (role: string, data: Record<string, any>) => {
    const response = await apiClient.post<ApiResponse<Task>>(
      `${getRolePrefix(role)}/tasks`,
      data
    );
    return response.data;
  },

  update: async (role: string, id: number, data: Record<string, any>) => {
    const response = await apiClient.put<ApiResponse<Task>>(
      `${getRolePrefix(role)}/tasks/${id}`,
      data
    );
    return response.data;
  },

  delete: async (role: string, id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/tasks/${id}`
    );
    return response.data;
  },

  getStats: async (): Promise<TaskStats> => ({
    activeTasks:        { value: 0,   label: "Active Tasks"          },
    loggedHours:        { value: "0", label: "Logged Hours"          },
    budgetUtilization:  { value: "0%", label: "Budget Utilization"   },
  }),

  getTasksData: async (role: string, companyId?: number) => {
    const url = companyId
      ? `${getRolePrefix(role)}/tasks-data/${companyId}`
      : `${getRolePrefix(role)}/tasks-data`;
    const response = await apiClient.get<ApiResponse<{ projects: any[]; employees: any[] }>>(url);
    return response.data;
  },

  getProjectEmployees: async (role: string, projectId: number) => {
    const response = await apiClient.get<ApiResponse<{ employees: any[] }>>(
      `${getRolePrefix(role)}/tasks/project-employees/${projectId}`
    );
    return response.data;
  },
};