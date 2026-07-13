"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { paymentApi } from "../api/payments.api";
import { useAuth } from "@/providers/AuthProvider";

export const usePayments = (params?: { search?: string; page?: number; status?: string; per_page?: number }) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["payments", role, params],
    queryFn: () => paymentApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const usePaymentStats = (role: string) => {
  return useQuery({
    queryKey: ["paymentStats", role],
    queryFn: () => paymentApi.getStats(role),
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: Record<string, any>) => paymentApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, any> }) => paymentApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const useDeletePayment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: string | number) => paymentApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
};

export const usePaymentData = (role: string, companyId?: string | number) => {
  return useQuery({
    queryKey: ["paymentData", role, companyId],
    queryFn: () => paymentApi.getCompanyData(role, companyId),
    enabled: role === "super_admin" ? !!companyId : true,
  });
};
