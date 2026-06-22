"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { roleApi } from "../api/roles.api";
import type { Role, RolesQueryParams } from "../types/roles.types";

export const useRoles = (params?: RolesQueryParams) =>
  useQuery({
    queryKey: ["roles", params],
    queryFn: () => roleApi.getAll(params),
    placeholderData: keepPreviousData,
  });

export const useRoleStats = () =>
  useQuery({
    queryKey: ["roleStats"],
    queryFn: () => roleApi.getStats(),
  });

export const useCreateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Role>) => roleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Role> }) => roleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => roleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({ queryKey: ["roleStats"] });
    },
  });
};
