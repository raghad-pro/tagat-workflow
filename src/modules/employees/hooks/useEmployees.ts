"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { employeeApi } from "../api/employees.api";
import type { Employee, EmployeesQueryParams } from "../types/employees.types";
import { useAuth } from "@/providers/AuthProvider";

export const useEmployees = (params?: EmployeesQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["employees", role, params],
    queryFn: () => employeeApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useEmployeeStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["employeeStats", role],
    queryFn: () => employeeApi.getStats(role),
  });
};

export const useCompanyData = (companyId?: string | number) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["companyData", role, companyId],
    queryFn: async () => employeeApi.getCompanyData(role, companyId),
    enabled: role === "company" || !!companyId,
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
