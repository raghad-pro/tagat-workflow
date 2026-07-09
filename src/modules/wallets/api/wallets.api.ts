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
  getAll: (params?: WalletsQueryParams, role = "super_admin") =>
    apiClient.get<ApiWalletsResponse>(`${getRolePrefix(role)}/wallets`, params as Record<string, unknown>),

  getById: (id: number, role = "super_admin") =>
    apiClient.get<ApiWalletResponse>(`${getRolePrefix(role)}/wallets/${id}`),

  getCompanyCurrencies: (companyId: number, role = "super_admin") =>
    apiClient.get<ApiCompanyCurrenciesResponse>(
      role === "super_admin" 
        ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
        : `${getRolePrefix(role)}/companies/${companyId}/currencies`
    ),

  create: (data: AddWalletRequest, role = "super_admin") =>
    apiClient.post<ApiWalletResponse>(`${getRolePrefix(role)}/wallets`, data),

  update: (id: number, data: Partial<AddWalletRequest>, role = "super_admin") =>
    apiClient.put<ApiWalletResponse>(`${getRolePrefix(role)}/wallets/${id}`, data),

  delete: (id: number, role = "super_admin") =>
    apiClient.delete<{ success: boolean; message: string }>(`${getRolePrefix(role)}/wallets/${id}`),
};
