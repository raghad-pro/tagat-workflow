"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { clientApi }                  from "../api/clients.api";
import type { ClientsQueryParams }    from "../types/clients.types";
import { useAuth }                    from "@/providers/AuthProvider";

export const useClients = (params: ClientsQueryParams) => {
  const { user } = useAuth();
  const role     = user?.role ?? "super_admin";

  return useQuery({
    queryKey:        ["clients", role, params],
    queryFn:         () => clientApi.getAll(params, role),
    placeholderData: keepPreviousData,
  });
};