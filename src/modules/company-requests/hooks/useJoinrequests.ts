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
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["join-requests", role, params],
    queryFn: async () => {
      try {
        const res: any = await joinRequestApi.getAll(role, params);
        const dataArray = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        return {
          role: res?.role || role,
          rows: flattenRequests(dataArray),
          raw: dataArray,
        };
      } catch (err) {
        console.error("Failed to fetch join requests:", err);
        return {
          role,
          rows: [],
          raw: [],
        };
      }
    },
    placeholderData: keepPreviousData,
    retry: 1,
  });
};