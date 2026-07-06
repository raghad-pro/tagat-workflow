"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi, type DashboardRole } from "../api/dashboard.api";

export const useDashboard = (role: DashboardRole, token: string) =>
  useQuery({
    queryKey:  ["dashboard", role],
    queryFn:   () => dashboardApi.getDashboard(role, token),
    enabled:   !!token && !!role,
    staleTime: 5 * 60 * 1000,  // 5 دقايق — بيانات الداشبورد ما بتتغير كل ثانية
    retry:     1,               // مرة واحدة بس بدل 3
    // لو فشل ما نمسح البيانات القديمة فوراً
    placeholderData: (prev) => prev,
  });