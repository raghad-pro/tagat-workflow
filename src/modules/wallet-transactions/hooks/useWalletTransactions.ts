import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletTransactionsApi } from "../api/wallet-transactions.api";
import { WalletTransactionsQueryParams, AddTransactionRequest, UpdateTransactionRequest } from "../types/wallet-transactions.types";

export const useWalletTransactions = (params?: WalletTransactionsQueryParams) => {
  return useQuery({
    queryKey: ["walletTransactions", params],
    queryFn: () => walletTransactionsApi.getAll(params),
  });
};

export const useWalletTransactionStats = () => {
  return useQuery({
    queryKey: ["walletTransactionStats"],
    queryFn: () => walletTransactionsApi.getStats(),
  });
};

export const useAddWalletTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddTransactionRequest) => walletTransactionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactionStats"] });
    },
  });
};

export const useUpdateWalletTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) => 
      walletTransactionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactionStats"] });
    },
  });
};

export const useDeleteWalletTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => walletTransactionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      queryClient.invalidateQueries({ queryKey: ["walletTransactionStats"] });
    },
  });
};
