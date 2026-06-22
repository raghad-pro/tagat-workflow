"use client";

import { useQuery } from "@tanstack/react-query";
import { companyApi } from "@/modules/companies/api/companies.api";

export const useCompanyStats = () => {
  return useQuery({
    queryKey: ["companies", "stats"],
    queryFn:  () => companyApi.getStats(),
  });
};