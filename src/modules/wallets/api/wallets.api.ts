import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Wallet,
  WalletsQueryParams,
  AddWalletRequest,
  ApiWalletsResponse,
  ApiWalletResponse,
  ApiCompanyCurrenciesResponse,
} from "../types/wallets.types";

export const walletsApi = {
  getAll: async (params?: WalletsQueryParams, role = "super_admin"): Promise<ApiWalletsResponse> => {
    const res = await apiClient.get<any>(`${getRolePrefix(role)}/wallets`, params as Record<string, unknown>);
    const payload = res?.data || res;

    let list: Wallet[] = [];
    let currentPage = 1;
    let total = 0;
    let lastPage = 1;
    let perPage = params?.per_page || 10;

    if (Array.isArray(payload)) {
      list = payload;
      total = payload.length;
    } else if (payload && typeof payload === "object") {
      if (Array.isArray(payload.data)) {
        list = payload.data;
        currentPage = payload.current_page || 1;
        total = payload.total || list.length;
        lastPage = payload.last_page || 1;
        perPage = payload.per_page || perPage;
      } else if (Array.isArray(payload.wallets)) {
        list = payload.wallets;
        total = list.length;
      }
    }

    return {
      success: true,
      data: {
        current_page: currentPage,
        data: list,
        total: total,
        per_page: perPage,
        last_page: lastPage,
      }
    };
  },

  getById: async (id: number, role = "super_admin"): Promise<ApiWalletResponse> => {
    const res = await apiClient.get<any>(`${getRolePrefix(role)}/wallets/${id}`);
    const data = res?.data || res;
    return { success: true, data };
  },

  getCompanyCurrencies: async (companyId?: number | null, role = "super_admin"): Promise<ApiCompanyCurrenciesResponse> => {
    const url = (role === "super_admin" && companyId)
      ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
      : `${getRolePrefix(role)}/currencies`;
      
    try {
      const res = await apiClient.get<any>(url);
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : (Array.isArray(data.data) ? data.data : []);
      return { success: true, data: list };
    } catch {
      return { success: true, data: [] };
    }
  },

  create: async (data: AddWalletRequest, role = "super_admin"): Promise<ApiWalletResponse> => {
    const payload: any = { ...data };
    if (!payload.company_id) {
      delete payload.company_id;
    } else {
      payload.company_id = Number(payload.company_id);
    }
    if (payload.currency_id) {
      payload.currency_id = Number(payload.currency_id);
    }
    const res = await apiClient.post<any>(`${getRolePrefix(role)}/wallets`, payload);
    const resultData = res?.data || res;
    return { success: true, data: resultData };
  },

  update: async (id: number, data: Partial<AddWalletRequest>, role = "super_admin"): Promise<ApiWalletResponse> => {
    const payload: any = { ...data };
    if (!payload.company_id) {
      delete payload.company_id;
    } else {
      payload.company_id = Number(payload.company_id);
    }
    if (payload.currency_id) {
      payload.currency_id = Number(payload.currency_id);
    }
    const res = await apiClient.put<any>(`${getRolePrefix(role)}/wallets/${id}`, payload);
    const resultData = res?.data || res;
    return { success: true, data: resultData };
  },

  delete: async (id: number, role = "super_admin") => {
    const res = await apiClient.delete<any>(`${getRolePrefix(role)}/wallets/${id}`);
    return res?.data || res || { success: true, message: "Deleted successfully" };
  },
};
