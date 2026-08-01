"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { contractApi } from "../api/contracts.api";
import type { Contract, ContractsQueryParams } from "../types/contracts.types";
import toast from "react-hot-toast";

export const useContracts = (role: string, params: ContractsQueryParams) => {
  return useQuery({
    queryKey: ["contracts", role, params],
    queryFn: () => contractApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useContractStats = (role: string) => {
  return useQuery({
    queryKey: ["contract-stats", role],
    queryFn: () => contractApi.getStats(role),
  });
};

export const useCreateContract = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Contract, "id">) => contractApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
      toast.success("تم إضافة العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة العقد");
    },
  });
};

export const useUpdateContract = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) => contractApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
      toast.success("تم تعديل العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تعديل العقد");
    },
  });
};

export const useDeleteContract = (role: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["contract-stats"] });
      toast.success("تم حذف العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العقد");
    },
  });
};
