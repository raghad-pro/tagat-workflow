"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { paymentsApi } from "../api/payments.api";
import type { PaymentsQueryParams, AddPaymentRequest, UpdatePaymentRequest } from "../types/payments.types";

export const usePayments = (params: PaymentsQueryParams) => {
  return useQuery({
    queryKey: ["payments", params],
    queryFn: () => paymentsApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: ["paymentStats"],
    queryFn: async () => {
      // Fetch a large page to compute stats locally
      const res = await paymentsApi.getAll({ per_page: 50, page: 1 });
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

export const usePaymentData = (companyId: number) => {
  return useQuery({
    queryKey: ["paymentData", companyId],
    queryFn: () => paymentsApi.getPaymentData(companyId),
    enabled: !!companyId, // Only fetch if companyId is greater than 0
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddPaymentRequest) => paymentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePaymentRequest }) => paymentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => paymentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["paymentStats"] });
    },
  });
};
