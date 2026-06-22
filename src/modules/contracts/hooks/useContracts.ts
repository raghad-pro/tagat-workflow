"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { contractApi } from "../api/contracts.api";
import type { ContractsQueryParams } from "../types/contracts.types";

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
