"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { kpisApi } from "../api/kpis.api";
import type { KpiQueryParams } from "../types/kpis.types";

export const KPI_QUERY_KEYS = {
  all: ["kpis"] as const,
  dashboard: (role: string, params?: KpiQueryParams) => ["kpis", "dashboard", role, params] as const,
  filters: (role: string) => ["kpis", "filters", role] as const,
  trends: (role: string, year?: number) => ["kpis", "trends", role, year] as const,
};

export function useKpiDashboard(params?: KpiQueryParams) {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: KPI_QUERY_KEYS.dashboard(role, params),
    queryFn: () => kpisApi.getDashboard(role, params),
    staleTime: 60000,
  });
}

export function useKpiFilters() {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: KPI_QUERY_KEYS.filters(role),
    queryFn: () => kpisApi.getFilters(role),
    staleTime: 300000,
  });
}

export function useKpiTrends(year?: number) {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: KPI_QUERY_KEYS.trends(role, year),
    queryFn: () => kpisApi.getTrends(role, year),
    staleTime: 60000,
  });
}
