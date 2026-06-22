"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { employeeApi } from "../api/employees.api";
import type { EmployeesQueryParams } from "../types/employees.types";

export const useEmployees = (params?: EmployeesQueryParams) =>
  useQuery({
    queryKey: ["employees", params],
    queryFn: () => employeeApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useEmployeeStats = () =>
  useQuery({
    queryKey: ["employeeStats"],
    queryFn: () => employeeApi.getStats(),
  });
