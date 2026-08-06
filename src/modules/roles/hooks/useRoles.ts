"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { roleApi } from "../api/roles.api";
import type { RolePayload, RolesQueryParams } from "../types/roles.types";
import { useAuth } from "@/providers/AuthProvider";

export const roleKeys = {
  all: ["roles"] as const,
  list: (role: string, params?: RolesQueryParams) => ["roles", role, params] as const,
  detail: (role: string, id: number | string) => ["role", role, id] as const,
  stats: ["roleStats"] as const,
  formPermissions: (role: string) => ["form-permissions", role] as const,
  companyRoles: (role: string, companyId?: number | string | null) =>
    ["company-roles", role, companyId] as const,
};

const useRolePrefix = () => useAuth().user?.role || "super_admin";

export const useRoles = (params?: RolesQueryParams) => {
  const role = useRolePrefix();
  return useQuery({
    queryKey: roleKeys.list(role, params),
    queryFn: () => roleApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useRole = (id?: number | string | null) => {
  const role = useRolePrefix();
  return useQuery({
    queryKey: roleKeys.detail(role, id ?? ""),
    queryFn: () => roleApi.getById(role, id!),
    enabled: !!id,
  });
};

export const useRoleStats = () => {
  const role = useRolePrefix();
  return useQuery({
    queryKey: [...roleKeys.stats, role],
    queryFn: () => roleApi.getStats(role),
  });
};

/**
 * The grantable permission catalog. Rarely changes, so it is cached for the
 * session rather than refetched every time a role modal opens.
 */
export const useFormPermissions = () => {
  const role = useRolePrefix();
  return useQuery({
    queryKey: roleKeys.formPermissions(role),
    queryFn: () => roleApi.getFormPermissions(role),
    staleTime: 30 * 60 * 1000,
  });
};

/** Roles assignable to a given company's employees. */
export const useCompanyRoles = (companyId?: number | string | null) => {
  const role = useRolePrefix();
  const query = useQuery({
    queryKey: roleKeys.companyRoles(role, companyId),
    queryFn: () => roleApi.getCompanyRoles(role, companyId!),
    enabled: !!companyId,
  });
  return { ...query, data: query.data ?? [] };
};

function useInvalidateRoles() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: roleKeys.all });
    queryClient.invalidateQueries({ queryKey: roleKeys.stats });
    queryClient.invalidateQueries({ queryKey: ["company-roles"] });
  };
}

export const useCreateRole = () => {
  const role = useRolePrefix();
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (data: RolePayload) => roleApi.create(role, data),
    onSuccess: invalidate,
  });
};

export const useUpdateRole = () => {
  const role = useRolePrefix();
  const invalidate = useInvalidateRoles();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: RolePayload }) =>
      roleApi.update(role, id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(role, id) });
      invalidate();
    },
  });
};

export const useDeleteRole = () => {
  const role = useRolePrefix();
  const invalidate = useInvalidateRoles();
  return useMutation({
    mutationFn: (id: string | number) => roleApi.delete(role, id),
    onSuccess: invalidate,
  });
};
