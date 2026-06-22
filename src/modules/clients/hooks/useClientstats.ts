"use client";

import { useQuery } from "@tanstack/react-query";
import { clientApi } from "../api/clients.api";
import { useAuth } from "@/providers/AuthProvider";

export const useClientStats = () => {
  const { user } = useAuth();
  const role = user?.role ?? "super_admin";

  return useQuery({
    queryKey: ["clients", "stats", role],
    queryFn: () => clientApi.getAll({ per_page: 100 }, role),
    // بدون staleTime — بتتحدث مع كل invalidateQueries(["clients"])
    select: (res) => {
      const list = res?.data?.data ?? [];
      let approved = 0, pending = 0, rejected = 0;
      list.forEach((c: any) => {
        c.companies?.forEach((comp: any) => {
          const s = comp.pivot?.status ?? comp.status;
          if (s === "approved") approved++;
          else if (s === "pending") pending++;
          else if (s === "rejected") rejected++;
        });
      });
      return { total: list.length, approved, pending, rejected };
    },
  });
};