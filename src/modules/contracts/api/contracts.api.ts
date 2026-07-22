import apiClient from "@/services/apiClient";
import type { Contract, ContractStats, ContractsQueryParams } from "../types/contracts.types";
import { DUMMY_CONTRACTS, DUMMY_STATS } from "../data/mockData";

let mockContracts = [...DUMMY_CONTRACTS];

export const contractApi = {
  getAll: async (params?: ContractsQueryParams) => {
    try {
      const res = await apiClient.get<{ data: Contract[]; total: number }>("/company/contracts", params as Record<string, unknown>);
      if (res && res.data && Array.isArray(res.data)) {
        return res;
      }
    } catch {
      // Fallback to local filtering if endpoint not live yet
    }
    
    let filtered = [...mockContracts];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter((c) =>
        c.customerName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q)
      );
    }
    
    // Manual pagination for mock
    const page = params?.page || 1;
    const perPage = params?.per_page || 4;
    const start = (page - 1) * perPage;
    const paginatedData = filtered.slice(start, start + perPage);

    return { data: paginatedData, total: filtered.length };
  },

  getStats: async (): Promise<ContractStats> => {
    try {
      const res = await apiClient.get<ContractStats>("/company/contracts/stats");
      if (res && res.activeContracts) return res;
    } catch {
      // Fallback
    }
    return DUMMY_STATS;
  },

  create: async (data: Omit<Contract, "id">) => {
    try {
      return await apiClient.post<{ success: boolean; data: Contract }>("/company/contracts", data);
    } catch {
      const newContract = { ...data, id: Date.now() };
      mockContracts = [newContract, ...mockContracts];
      return { success: true, data: newContract };
    }
  },

  update: async (id: number, data: Partial<Contract>) => {
    try {
      return await apiClient.put<{ success: boolean; data: Contract }>(`/company/contracts/${id}`, data);
    } catch {
      mockContracts = mockContracts.map(c => c.id === id ? { ...c, ...data } : c);
      return { success: true, data: { ...mockContracts.find(c => c.id === id)!, ...data } };
    }
  },

  delete: async (id: number) => {
    try {
      return await apiClient.delete<{ success: boolean }>(`/company/contracts/${id}`);
    } catch {
      mockContracts = mockContracts.filter(c => c.id !== id);
      return { success: true };
    }
  },
};