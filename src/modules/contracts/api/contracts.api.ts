import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Contract, ContractStats, ContractsQueryParams } from "../types/contracts.types";

export const contractApi = {
  getAll: async (role: string, params?: ContractsQueryParams) => {
    try {
      const response = await apiClient.get(
        `${getRolePrefix(role)}/contracts`,
        params as Record<string, unknown>
      );
      const payload = (response as any)?.data ?? response;

      if (Array.isArray(payload)) {
        return { data: payload, total: payload.length };
      }

      return {
        data: payload?.data || [],
        total: payload?.meta?.total || payload?.total || payload?.data?.length || 0,
      };
    } catch (err) {
      console.warn("Contracts API unavailable, using fallback empty list:", err);
      return { data: [], total: 0 };
    }
  },

  /** There is no `/contracts/stats` route; the cards show zeros until one exists. */
  getStats: async (): Promise<ContractStats> => {
    return {
      activeContracts: { value: "0", label: "Active" },
      pendingSignature: { value: "0", label: "Pending" },
      expiringSoon: { value: "0", label: "Expiring" },
    };
  },

  create: async (role: string, data: Partial<Contract>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/contracts`, data);
    return (response as any).data;
  },

  update: async (role: string, id: number, data: Partial<Contract>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/contracts/${id}`, data);
    return (response as any).data;
  },

  delete: async (role: string, id: number) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/contracts/${id}`);
    return (response as any).data;
  },
};