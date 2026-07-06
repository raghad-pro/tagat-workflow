"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientCompanyApi } from "../api/client-companies.api";

export const useClientCompanies = (params?: { search?: string; page?: number }) => {
  return useQuery({
    queryKey: ["client-companies", params],
    queryFn: () => clientCompanyApi.getAll(params),
  });
};

export const useRequestJoinCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (companyId: number) => clientCompanyApi.requestJoin(companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client-companies"] });
    },
  });
};
