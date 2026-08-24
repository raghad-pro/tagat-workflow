"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import { useAuth } from "@/providers/AuthProvider";

interface CompanyRow {
  id: number;
  name: string;
}

/**
 * Resolves `company_id` to a company name.
 *
 * The meetings API returns `company_id` only — it never embeds a `company`
 * relation — so the list and detail screens have to look the name up.
 *
 * Where that name comes from depends on the role: `/super_admin/companies`
 * answers 403 for anyone but a super admin, so every other role reads its own
 * company off `/{role}/account`, which embeds the full company object.
 */
export function useCompanyNames() {
  const { user } = useAuth();
  const role = user?.role || "employee";
  const isSuperAdmin = role === "super_admin";

  const { data: allCompanies, isLoading: loadingList } = useQuery({
    queryKey: ["meetings", "companies", "all"],
    queryFn: () =>
      apiClient.get<any>("/super_admin/companies", { per_page: 100 }),
    enabled: isSuperAdmin,
    staleTime: 5 * 60 * 1000,
  });

  const { data: account, isLoading: loadingAccount } = useQuery({
    queryKey: ["meetings", "own-company", role],
    queryFn: () => apiClient.get<any>(`${getRolePrefix(role)}/account`),
    enabled: !isSuperAdmin && Boolean(user),
    staleTime: 5 * 60 * 1000,
  });

  const namesById = useMemo(() => {
    const map = new Map<number, string>();

    const add = (row: Partial<CompanyRow> | undefined) => {
      const id = Number(row?.id);
      if (Number.isFinite(id) && row?.name) map.set(id, row.name);
    };

    if (isSuperAdmin) {
      const rows: any[] = allCompanies?.data?.data ?? allCompanies?.data ?? [];
      if (Array.isArray(rows)) rows.forEach(add);
    } else {
      add(account?.data?.company);
    }

    return map;
  }, [isSuperAdmin, allCompanies, account]);

  const resolveCompanyName = useCallback(
    (companyId: unknown, fallback = "—"): string =>
      namesById.get(Number(companyId)) || fallback,
    [namesById]
  );

  return {
    namesById,
    resolveCompanyName,
    isLoading: isSuperAdmin ? loadingList : loadingAccount,
  };
}
