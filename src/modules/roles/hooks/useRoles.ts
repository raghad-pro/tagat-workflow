"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { roleApi } from "../api/roles.api";
import type { Role, RolesQueryParams } from "../types/roles.types";
import { useAuth } from "@/providers/AuthProvider";

export const useRoles = (params?: RolesQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["roles", role, params],
    queryFn: () => roleApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useRoleStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["roleStats", role],
    queryFn: () => roleApi.getStats(role),
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: Partial<Role>) => roleApi.create(role, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Role> }) => roleApi.update(role, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: string | number) => roleApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};
