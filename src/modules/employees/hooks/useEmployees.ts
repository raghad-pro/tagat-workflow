"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { employeeApi } from "../api/employees.api";
import type { Employee, EmployeeStats, EmployeesQueryParams } from "../types/employees.types";
import { useAuth } from "@/providers/AuthProvider";

/** No role prefix exposes an employee roster to a client, so the query is skipped for them. */
export const useEmployees = (params?: EmployeesQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["employees", role, params],
    queryFn: () => employeeApi.getAll(role, params),
    placeholderData: keepPreviousData,
    enabled: role !== "client",
  });
};

/**
 * Every employee, across all server pages.
 *
 * The list endpoint hard-caps a page at 10 rows and ignores `per_page`, so
 * asking for a big page silently returns the first ten. Screens that filter,
 * count or paginate locally need the whole set or their numbers are wrong.
 */
export const useAllEmployees = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["employees", role, "all"],
    queryFn: () => employeeApi.getAllPages(role),
    placeholderData: keepPreviousData,
    enabled: role !== "client",
  });
};

/**
 * Counted off `useAllEmployees` — the same rows the management page renders —
 * rather than walking the paginator a second time. Off `user.is_active`: the
 * record has no `status` column of its own.
 */
export const useEmployeeStats = () => {
  const { data: res } = useAllEmployees();

  const data = useMemo<EmployeeStats | undefined>(() => {
    if (!res) return undefined;
    const employees = res.data;
    const isActive = (e: any) => Number(e?.user?.is_active ?? e?.is_active ?? 1) === 1;
    return {
      total:    res.meta.total || employees.length,
      active:   employees.filter(isActive).length,
      inactive: employees.filter((e: any) => !isActive(e)).length,
    };
  }, [res]);

  return { data };
};

export const useCompanyData = (companyId?: string | number) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["companyData", role, companyId],
    queryFn: async () => employeeApi.getCompanyData(role, companyId),
    enabled: (role === "super_admin" || role === "company") && !!companyId,
  });
};

export const useCompanyCurrencies = (companyId?: string | number) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["companyCurrencies", role, companyId],
    queryFn: async () => employeeApi.getCompanyCurrencies(role, companyId),
    enabled: role === "company" || !!companyId,
  });
};

export const useCreateEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: Partial<Employee>) => employeeApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};

export const useUpdateEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Employee> }) => employeeApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};

export const useDeleteEmployee = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: string | number) => employeeApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};
