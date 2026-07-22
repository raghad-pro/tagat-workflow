"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { contractApi } from "../api/contracts.api";
import type { Contract, ContractsQueryParams } from "../types/contracts.types";
import toast from "react-hot-toast";

export const useContracts = (params: ContractsQueryParams) => {
  return useQuery({
    queryKey: ["contracts", params],
    queryFn: () => contractApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useContractStats = () => {
  return useQuery({
    queryKey: ["contract-stats"],
    queryFn: () => contractApi.getStats(),
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Contract, "id">) => contractApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("تم إضافة العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء إضافة العقد");
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contract> }) => contractApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("تم تعديل العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء تعديل العقد");
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => contractApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      toast.success("تم حذف العقد بنجاح");
    },
    onError: () => {
      toast.error("حدث خطأ أثناء حذف العقد");
    },
  });
};
