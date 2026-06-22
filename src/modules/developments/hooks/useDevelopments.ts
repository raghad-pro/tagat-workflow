"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { developmentApi } from "../api/developments.api";
import type { DevelopmentsQueryParams } from "../types/developments.types";

export const useDevelopments = (params?: DevelopmentsQueryParams) => {
  return useQuery({
    queryKey: ["developments", params],
    queryFn: () => developmentApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useDevelopmentStats = () => {
  return useQuery({
    queryKey: ["developmentStats"],
    queryFn: () => developmentApi.getStats(),
  });
};
