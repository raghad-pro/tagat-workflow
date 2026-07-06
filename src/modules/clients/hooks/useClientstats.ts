"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "../api/clients.api";
import { useAuth } from "@/providers/AuthProvider";

interface ClientStats {
  total:    number;
  approved: number;
  pending:  number;
  rejected: number;
}

export const useClientStats = () => {
  const { user } = useAuth();
  const role     = user?.role ?? "super_admin";

  return useQuery({
    queryKey: ["clients", "stats", role],
    queryFn:  async (): Promise<ClientStats> => {
      // نجيب صفحة واحدة بس عشان نحصل على الـ total من الـ meta
      // الإحصائيات التفصيلية بنحسبها من نفس البيانات
      const res  = await clientApi.getAll({ per_page: 50, page: 1 }, role);
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
    },
  });
};