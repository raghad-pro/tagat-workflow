"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";
import { useAuth } from "@/providers/AuthProvider";
import type {
  JoinRequestsQueryParams,
  JoinRequest,
  JoinRequestClient,
} from "../types/company-requests.types";

// ─── Flatten helper ────────────────────────────────────────────────────────────
function flattenRequests(clients: JoinRequestClient[]): JoinRequest[] {
  return clients.flatMap((client) =>
    client.companies.map((company) => ({
      id: `${client.id}-${company.id}`,
      clientId: client.id,
      companyId: company.id,
      clientName: client.name,
      companyName: company.name,
      companyEmail: company.email,
      status: company.pivot.status,
      createdAt: company.pivot.created_at,
    }))
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export const useJoinRequests = (params: JoinRequestsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["join-requests", role, params],
    queryFn: async () => {
      const res = await joinRequestApi.getAll(role, params);
      return {
        role: res.role,                   
        rows: flattenRequests(res.data), 
        raw:  res.data,               
      };
    },
    placeholderData: keepPreviousData,
  });
};