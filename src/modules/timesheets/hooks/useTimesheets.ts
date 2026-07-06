"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { timesheetsApi, TimesheetQueryParams } from "../api/timesheets.api";
import { useAuth } from "@/providers/AuthProvider";

export const useTimesheets = (params?: TimesheetQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["timesheets", role, params],
    queryFn: () => timesheetsApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useApproveTimesheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timesheetsApi.approve(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
};

export const useRejectTimesheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timesheetsApi.reject(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
};

export const useDeleteTimesheet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timesheetsApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timesheets"] });
    },
  });
};
