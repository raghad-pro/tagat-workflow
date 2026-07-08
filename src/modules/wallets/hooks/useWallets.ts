"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { walletsApi } from "../api/wallets.api";
import type { WalletsQueryParams, AddWalletRequest, Wallet } from "../types/wallets.types";

export const useWallets = (params: WalletsQueryParams) => {
  return useQuery({
    queryKey: ["wallets", params],
    queryFn: () => walletsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useCompanyCurrencies = (companyId: number | null) => {
  return useQuery({
    queryKey: ["companyCurrencies", companyId],
    queryFn: () => walletsApi.getCompanyCurrencies(companyId!),
    enabled: !!companyId,
    placeholderData: keepPreviousData,
  });
};

export const useWalletStats = () => {
  return useQuery({
    queryKey: ["walletStats"],
    queryFn: async () => {
      // Fetch a large page to compute stats locally (similar to companies)
      const res = await walletsApi.getAll({ per_page: 50, page: 1 });
      const list = res?.data?.data ?? [];
      const meta = res?.data;

      let totalBalance = 0;

      list.forEach((w: Wallet) => {
        totalBalance += Number(w.balance);
      });

      const avgBalance = list.length > 0 ? totalBalance / list.length : 0;

      return {
        totalWallets: meta?.total ?? list.length,
        totalBalance,
        avgBalance,
        pendingWallets: 0, // Not provided by the API anymore
      };
    },
  });
};

export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddWalletRequest) => walletsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};

export const useUpdateWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddWalletRequest> }) => walletsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};

export const useDeleteWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => walletsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};
