import apiClient from "@/services/apiClient";
import type {
  Wallet,
  WalletsQueryParams,
  AddWalletRequest,
  ApiWalletsResponse,
  ApiWalletResponse,
  ApiCompanyCurrenciesResponse,
} from "../types/wallets.types";

export const walletsApi = {
  // ─── GET /super_admin/wallets ───────────────────────────────────────────
  getAll: (params?: WalletsQueryParams) =>
    apiClient.get<ApiWalletsResponse>("/super_admin/wallets", params as Record<string, unknown>),

  // ─── GET /super_admin/wallets/:id ───────────────────────────────────────
  getById: (id: number) =>
    apiClient.get<ApiWalletResponse>(`/super_admin/wallets/${id}`),

  // ─── GET /super_admin/companies/:id/currencies ──────────────────────────
  getCompanyCurrencies: (companyId: number) =>
    apiClient.get<ApiCompanyCurrenciesResponse>(`/super_admin/companies/${companyId}/currencies`),

  // ─── POST /super_admin/wallets ──────────────────────────────────────────
  create: (data: AddWalletRequest) =>
    apiClient.post<ApiWalletResponse>("/super_admin/wallets", data),

  // ─── PUT /super_admin/wallets/:id ───────────────────────────────────────
  update: (id: number, data: Partial<AddWalletRequest>) =>
    apiClient.put<ApiWalletResponse>(`/super_admin/wallets/${id}`, data),

  // ─── DELETE /super_admin/wallets/:id ────────────────────────────────────
  delete: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/super_admin/wallets/${id}`),
};
