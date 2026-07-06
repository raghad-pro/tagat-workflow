"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { companyApi } from "@/modules/companies/api/companies.api";
import type { CompaniesQueryParams, AddCompanyRequest } from "@/modules/companies/types/companies.types";

export const useCompanies = (params: CompaniesQueryParams) => {
  return useQuery({
    queryKey: ["companies", params],
    queryFn:  () => companyApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useCompanyStats = () => {
  return useQuery({
    queryKey: ["companyStats"],
    queryFn: async () => {
      // Fetch a large page to compute stats from local data as requested
      const res = await companyApi.getAll({ per_page: 50, page: 1 } as any);
      const list = res?.data?.data ?? [];
      const meta = (res?.data as any)?.meta ?? res?.data;

      let active = 0;
      let pending = 0;
      let inactive = 0;

      list.forEach((c: any) => {
        if (c.status === "active") active++;
        else if (c.status === "pending") pending++;
        else inactive++;
      });

      return {
        total: meta?.total ?? list.length,
        active,
        pending,
        inactive,
      };
    },
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCompanyRequest) => companyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyStats"] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AddCompanyRequest> }) => companyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyStats"] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      queryClient.invalidateQueries({ queryKey: ["companyStats"] });
    },
  });
};