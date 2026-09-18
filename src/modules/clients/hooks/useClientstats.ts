"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useClients } from "./useClients";

interface ClientStats {
  total:    number;
  approved: number;
  pending:  number;
  rejected: number;
}

/**
 * Counted off the same full list the management page already loads for its
 * local search and filtering — a second request for the same rows only
 * doubled the page's load.
 */
export const useClientStats = () => {
  const { user } = useAuth();
  const role     = user?.role ?? "super_admin";
  const { data: res, isLoading } = useClients({ page: 1, per_page: 1000 } as any);

  const data = useMemo<ClientStats | undefined>(() => {
    if (!res) return undefined;
    const list = res?.data?.data ?? [];
    const meta = res?.data;

    let approved = 0;
    let pending  = 0;
    let rejected = 0;
    let relevantTotal = 0;
    const isSuperAdmin = role === "super_admin";

    list.forEach((c: any) => {
      let hasRelevantCompany = false;
      c.companies?.forEach((comp: any) => {
        if (!isSuperAdmin && comp.id !== user?.company_id && comp.email !== user?.email) {
          return;
        }
        hasRelevantCompany = true;
        const s = comp.pivot?.status ?? comp.status;
        if (s === "approved") approved++;
        else if (s === "pending")  pending++;
        else if (s === "rejected") rejected++;
      });

      if (hasRelevantCompany) {
        relevantTotal++;
      }
    });

    return {
      total:    isSuperAdmin ? (meta?.total ?? list.length) : relevantTotal,
      approved,
      pending,
      rejected,
    };
  }, [res, role, user?.company_id, user?.email]);

  return { data, isLoading };
};
