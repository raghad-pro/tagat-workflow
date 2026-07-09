"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import type { PaymentsQueryParams, AddPaymentRequest, UpdatePaymentRequest } from "../types/payments.types";

export const usePayments = (role: string, params: PaymentsQueryParams) => {
  return useQuery({
    queryKey: ["payments", role, params],
    queryFn: () => paymentsApi.getAll(role, params),
    placeholderData: keepPreviousData,
    enabled: !!role,
  });
};

export const usePaymentStats = (role: string) => {
  return useQuery({
    queryKey: ["paymentStats", role],
    queryFn: async () => {
      // Fetch a large page to compute stats locally
      const res = await paymentsApi.getAll(role, { per_page: 50, page: 1 });
      const list = res?.data?.data ?? [];
      const meta = res?.data;

      let totalRevenue = 0;
      let pendingPayments = 0; // Assuming pending if paid_at is null, or simply 0 if not tracked

      list.forEach((p) => {
        const amt = Number(p.amount);
        totalRevenue += amt;
        if (!p.paid_at) {
          pendingPayments += amt;
        }
      });

      return {
        success: true,
        data: {
          totalRevenue,
          pendingPayments,
          transactionVolume: meta?.total ?? list.length,
        }
      };
    },
  });
};

export const usePaymentData = (role: string, companyId?: number) => {
  return useQuery({
    queryKey: ["paymentData", role, companyId],
    queryFn: () => paymentsApi.getPaymentData(role, companyId),
    enabled: !!role && (role === "company" || !!companyId),
  });
};

export const usePayment = (role: string, id: number | null) => {
  return useQuery({
    queryKey: ["payment", role, id],
    queryFn: () => paymentsApi.getSingle(role, id!),
    enabled: !!role && !!id,
  });
};

export const useCreatePayment = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddPaymentRequest) => paymentsApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};

export const useUpdatePayment = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentRequest }) => paymentsApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};

export const useDeletePayment = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};
