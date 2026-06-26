"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { timelogApi, TimelogQueryParams } from "../api/timelog.api";
import { useAuth } from "@/providers/AuthProvider";

export const useTimelogs = (params?: TimelogQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["timelogs", role, params],
    queryFn: () => timelogApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useApproveTimelog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timelogApi.approve(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelogs"] });
    },
  });
};

export const useRejectTimelog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timelogApi.reject(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelogs"] });
    },
  });
};

export const useDeleteTimelog = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => timelogApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timelogs"] });
    },
  });
};
