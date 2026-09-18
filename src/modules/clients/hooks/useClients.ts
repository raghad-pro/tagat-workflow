"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { clientApi }                  from "../api/clients.api";
import type { ClientsQueryParams }    from "../types/clients.types";
import { useAuth }                    from "@/providers/AuthProvider";

/** `/clients` exists for super admins and company admins only; anyone else gets 403 and, after enough of them, a revoked token. */
export const useClients = (params: ClientsQueryParams) => {
  const { user } = useAuth();
  const role     = user?.role ?? "super_admin";

  return useQuery({
    queryKey:        ["clients", role, params],
    queryFn:         () => clientApi.getAll(params, role),
    placeholderData: keepPreviousData,
    enabled:         role === "super_admin" || role === "company",
  });
};