import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import {
  WalletTransactionsQueryParams,
  ApiWalletTransactionsResponse,
  ApiWalletTransactionResponse,
  AddTransactionRequest,
  UpdateTransactionRequest,
} from "../types/wallet-transactions.types";

export const walletTransactionsApi = {
  getAll: async (role: string, params?: WalletTransactionsQueryParams): Promise<ApiWalletTransactionsResponse> => {
    const response = await apiClient.get<ApiWalletTransactionsResponse>(
      `${getRolePrefix(role)}/walletTransactions`,
      params as Record<string, unknown>
    );
    return response;
  },

  getSingle: async (role: string, id: string | number): Promise<ApiWalletTransactionResponse> => {
    const response = await apiClient.get<ApiWalletTransactionResponse>(
      `${getRolePrefix(role)}/walletTransactions/${id}`
    );
    return response;
  },

  create: async (role: string, data: AddTransactionRequest): Promise<ApiWalletTransactionResponse> => {
    const response = await apiClient.post<ApiWalletTransactionResponse>(
      `${getRolePrefix(role)}/walletTransactions`,
      data
    );
    return response;
  },

  update: async (role: string, id: string | number, data: UpdateTransactionRequest): Promise<ApiWalletTransactionResponse> => {
    const response = await apiClient.put<ApiWalletTransactionResponse>(
      `${getRolePrefix(role)}/walletTransactions/${id}`,
      data
    );
    return response;
  },

  delete: async (role: string, id: string | number) => {
    const response = await apiClient.delete(
      `${getRolePrefix(role)}/walletTransactions/${id}`
    );
    return response;
  },

  getWalletBalance: async (role: string, walletId: string | number) => {
    const response = await apiClient.get<{ success: boolean; message: string; data: { balance: string } }>(
      `${getRolePrefix(role)}/wallets/${walletId}/balance`
    );
    return response;
  }
};
