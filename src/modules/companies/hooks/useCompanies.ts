"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { companyApi } from "@/modules/companies/api/companies.api";
import type { CompaniesQueryParams } from "@/modules/companies/types/companies.types";

export const useCompanies = (params: CompaniesQueryParams) => {
  return useQuery({
    queryKey: ["companies", params],
    queryFn:  () => companyApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};