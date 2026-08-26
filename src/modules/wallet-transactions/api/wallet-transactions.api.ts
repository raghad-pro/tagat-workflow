import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import {
  WalletTransaction,
  WalletTransactionsQueryParams,
  ApiWalletTransactionsResponse,
  ApiWalletTransactionResponse,
  AddTransactionRequest,
  UpdateTransactionRequest,
} from "../types/wallet-transactions.types";

export const walletTransactionsApi = {
  getAll: async (role: string, params?: WalletTransactionsQueryParams): Promise<ApiWalletTransactionsResponse> => {
    const res = await apiClient.get<any>(
      `${getRolePrefix(role)}/walletTransactions`,
      params as Record<string, unknown>
    );

    // This API is not consistent about paginating: `/wallets` answers with a
    // Laravel paginator, and the same shape was assumed here — so a bare
    // `data: [...]` array read as `data.data === undefined` and the table sat
    // empty while the rows existed. Accept either, the way wallets already
    // does, and always hand back the paginated shape the page expects.
    const payload = res?.data ?? res;

    let list: WalletTransaction[] = [];
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
        total = payload.total ?? list.length;
        lastPage = payload.last_page || 1;
        perPage = payload.per_page || perPage;
      } else if (Array.isArray(payload.walletTransactions)) {
        list = payload.walletTransactions;
        total = list.length;
      }
    }

    return {
      success: true,
      message: res?.message ?? "",
      data: {
        current_page: currentPage,
        data: list,
        total,
        per_page: perPage,
        last_page: lastPage,
      },
    };
  },

  getSingle: async (role: string, id: string | number): Promise<ApiWalletTransactionResponse> => {
    const res = await apiClient.get<any>(
      `${getRolePrefix(role)}/walletTransactions/${id}`
    );
    // Unwrapped for the same reason as `getAll`: the View modal reads
    // `res.data`, which is empty when the row arrives unwrapped.
    return { success: true, message: res?.message ?? "", data: res?.data ?? res };
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
