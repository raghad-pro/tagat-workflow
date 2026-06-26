import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export interface TimelogQueryParams {
  page?:   number;
  month?:  string;
  status?: string;
  search?: string;
}

export const timelogApi = {
  getAll: async (role: string, params?: TimelogQueryParams) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/timesheets`,
      { params }
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
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/timesheets/${id}`
    );
    return response.data;
  },

  approve: async (role: string, id: number) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}/approve`
    );
    return response.data;
  },

  reject: async (role: string, id: number) => {
    const response = await apiClient.patch<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}/reject`
    );
    return response.data;
  },

  delete: async (role: string, id: number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/timesheets/${id}`
    );
    return response.data;
  },
};