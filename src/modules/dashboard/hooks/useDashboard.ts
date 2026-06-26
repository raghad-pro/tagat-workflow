"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type DashboardRole } from "../api/dashboard.api";

/**
 * Pass the authenticated user's role and token.
 * Both come from your auth context / session provider.
 *
 * Example:
 *   const { role, token } = useAuth();
 *   const { data, isLoading, error } = useDashboard(role, token);
 */
export const useDashboard = (role: DashboardRole, token: string) =>
  useQuery({
    queryKey: ["dashboard", role],
    queryFn:  () => dashboardApi.getDashboard(role, token),
    enabled:  !!token && !!role,   // don't fetch until auth is ready
    staleTime: 5 * 60 * 1000,      // 5 min — dashboard data doesn't change every second
    retry: 2,
  });