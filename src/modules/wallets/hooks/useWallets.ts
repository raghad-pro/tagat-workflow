"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { walletsApi } from "../api/wallets.api";
import type { WalletsQueryParams, AddWalletRequest, Wallet } from "../types/wallets.types";

import { useAuth } from "@/providers/AuthProvider";

export const useWallets = (params: WalletsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["wallets", role, params],
    queryFn: () => walletsApi.getAll(params, role),
    placeholderData: keepPreviousData,
  });
};

export const useCompanyCurrencies = (companyId: number | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["companyCurrencies", role, companyId],
    queryFn: () => walletsApi.getCompanyCurrencies(companyId!, role),
    enabled: role === "company" || !!companyId,
    placeholderData: keepPreviousData,
  });
};

export const useWalletStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["walletStats", role],
    queryFn: async () => {
      // Fetch a large page to compute stats locally (similar to companies)
      const res = await walletsApi.getAll({ per_page: 50, page: 1 }, role);
      const list = res?.data?.data ?? [];
      const meta = res?.data;

      let totalUSD = 0;
      let totalEUR = 0;

      list.forEach((w: Wallet) => {
        const code = w.currency?.code?.toUpperCase();
        if (code === "USD") totalUSD += Number(w.balance);
        if (code === "EUR" || code === "ERU") totalEUR += Number(w.balance);
      });

      return {
        totalWallets: meta?.total ?? list.length,
        totalUSD,
        totalEUR,
      };
    },
  });
};

export const useCreateWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: AddWalletRequest) => walletsApi.create(data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};

export const useUpdateWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddWalletRequest> }) => walletsApi.update(id, data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};

export const useDeleteWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => walletsApi.delete(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      queryClient.invalidateQueries({ queryKey: ["walletStats"] });
    },
  });
};
