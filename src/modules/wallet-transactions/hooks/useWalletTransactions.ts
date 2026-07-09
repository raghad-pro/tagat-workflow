"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { walletTransactionsApi } from "../api/wallet-transactions.api";
import { WalletTransactionsQueryParams, AddTransactionRequest, UpdateTransactionRequest } from "../types/wallet-transactions.types";
import { useAuth } from "@/providers/AuthProvider";

export const useWalletTransactions = (params?: WalletTransactionsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["walletTransactions", role, params],
    queryFn: () => walletTransactionsApi.getAll(role, params),
  });
};

export const useWalletTransaction = (id: string | number | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["walletTransaction", role, id],
    queryFn: () => walletTransactionsApi.getSingle(role, id!),
    enabled: !!id,
  });
};

export const useAddWalletTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: AddTransactionRequest) => walletTransactionsApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
      // The backend response for Stats is not provided, so I'm removing the stats hook from this file.
    },
  });
};

export const useUpdateWalletTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTransactionRequest }) => 
      walletTransactionsApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
  });
};

export const useDeleteWalletTransaction = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => walletTransactionsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["walletTransactions"] });
    },
  });
};

export const useWalletBalance = (walletId: string | number | undefined) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["walletBalance", role, walletId],
    queryFn: () => walletTransactionsApi.getWalletBalance(role, walletId!),
    enabled: !!walletId,
  });
};

export const useWalletTransactionStats = () => {
  // Temporary mock since no real API endpoint is provided yet
  return useQuery({
    queryKey: ["walletTransactionStats"],
    queryFn: async () => {
      return {
        success: true,
        message: "Stats retrieved",
        data: {
          totalVolume: 0,
          income: 0,
          expenses: 0,
        }
      };
    },
  });
};

