"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { joinRequestApi, unwrapClients } from "../api/company-requests.api";
import { useAuth } from "@/providers/AuthProvider";
import type {
  JoinRequestsQueryParams,
  JoinRequest,
  JoinRequestClient,
} from "../types/company-requests.types";

// ─── Flatten helper ────────────────────────────────────────────────────────────
function flattenRequests(clients: JoinRequestClient[]): JoinRequest[] {
  if (!Array.isArray(clients)) return [];
  return clients.flatMap((client) => {
    if (!client || !Array.isArray(client.companies)) return [];
    return client.companies.map((company) => ({
      id: `${client.id}-${company.id}`,
      clientId: client.id,
      companyId: company.id,
      clientName: client.name || "",
      companyName: company.name || "",
      companyEmail: company.email || "",
      status: company.pivot?.status || "pending",
      createdAt: company.pivot?.created_at || "",
    }));
  });
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useJoinRequests = (params: JoinRequestsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role;

  return useQuery({
    queryKey: ["join-requests", role, params],
    queryFn: async () => {
      const res = (await joinRequestApi.getAll(role as string, params)) as {
        role?: string;
      };
      const clients = unwrapClients(res);
      return { role: res?.role || role, rows: flattenRequests(clients), raw: clients };
    },
    // The endpoint is role-prefixed, so firing before the session resolves would
    // ask `/super_admin/requests` on behalf of a company user, then throw the
    // answer away when the real role arrives under a different key.
    enabled: !!role,
    placeholderData: keepPreviousData,
    retry: 1,
  });
};
