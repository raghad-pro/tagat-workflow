"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { developmentApi } from "../api/developments.api";
import { useAuth } from "@/providers/AuthProvider";
import type {
  DevelopmentsQueryParams,
  CreateDevelopmentRequest,
  UpdateDevelopmentRequest,
} from "../types/developments.types";

const QUERY_KEY = "developments";

// ─── List ────────────────────────────────────────────────────────────────────
export const useDevelopments = (params?: DevelopmentsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: [QUERY_KEY, role, params],
    queryFn: () => developmentApi.getAll(params, role),
    placeholderData: keepPreviousData,
    select: (res) => ({
      data: res.data.data,
      meta: {
        total: res.data.total,
        currentPage: res.data.current_page,
        lastPage: res.data.last_page,
        perPage: res.data.per_page,
      },
    }),
  });
};

// ─── Create ──────────────────────────────────────────────────────────────────
export const useCreateDevelopment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: CreateDevelopmentRequest) => developmentApi.create(data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["developmentStats"] });
    },
  });
};

// ─── Update ──────────────────────────────────────────────────────────────────
export const useUpdateDevelopment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDevelopmentRequest }) =>
      developmentApi.update(id, data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["developmentStats"] });
    },
  });
};

// ─── Delete ──────────────────────────────────────────────────────────────────
export const useDeleteDevelopment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: number) => developmentApi.delete(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["developmentStats"] });
    },
  });
};

// ─── Stats (Calculated from API) ───────────────────────────────────────────────
export const useDevelopmentStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["developmentStats", role],
    queryFn: async () => {
      const res = await developmentApi.getAll({ per_page: 50, page: 1 }, role);
      const list = res?.data?.data ?? [];
      const meta = res?.data;

      let underReview = 0;
      let approvedCost = 0;

      list.forEach((dev: any) => {
        if (dev.status === "pending") underReview++;
        if (dev.status === "completed" || dev.status === "in_progress") {
          approvedCost += Number(dev.cost) || 0;
        }
      });

      return {
        total: meta?.total ?? list.length,
        underReview,
        approved: approvedCost,
      };
    },
  });
};
