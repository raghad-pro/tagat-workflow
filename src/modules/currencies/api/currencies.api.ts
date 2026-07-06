import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Currency, CurrencyRequest } from "../types/currencies.types";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export const currencyApi = {
  getAll: async (role: string, params?: { search?: string; page?: number; per_page?: number }) => {
    const response = await apiClient.get<ApiResponse<any>>(
      `${getRolePrefix(role)}/currencies`,
      params as Record<string, unknown>
    );
    return response.data;
  },

  getSingle: async (role: string, id: string | number) => {
    const response = await apiClient.get<ApiResponse<Currency>>(
      `${getRolePrefix(role)}/currencies/${id}`
    );
    return response.data;
  },

  create: async (role: string, data: CurrencyRequest) => {
    const response = await apiClient.post<ApiResponse<Currency>>(
      `${getRolePrefix(role)}/currencies`,
      data
    );
    return response.data;
  },

  update: async (role: string, id: string | number, data: CurrencyRequest) => {
    const response = await apiClient.put<ApiResponse<Currency>>(
      `${getRolePrefix(role)}/currencies/${id}`,
      data
    );
    return response.data;
  },

  delete: async (role: string, id: string | number) => {
    const response = await apiClient.delete<ApiResponse<null>>(
      `${getRolePrefix(role)}/currencies/${id}`
    );
    return response.data;
  },
};
