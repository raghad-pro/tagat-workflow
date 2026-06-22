import type { Contract, ContractStats, ContractsQueryParams } from "../types/contracts.types";
import { DUMMY_CONTRACTS, DUMMY_STATS } from "../data/mockData";

export const contractApi = {
  getAll: async (params?: ContractsQueryParams) => {
    return new Promise<{ data: Contract[]; total: number }>((resolve) => {
      setTimeout(() => {
        let filtered = DUMMY_CONTRACTS;
        if (params?.search) {
          filtered = filtered.filter((c) =>
            c.customerName.toLowerCase().includes(params.search!.toLowerCase())
          );
        }
        resolve({ data: filtered, total: filtered.length });
      }, 500);
    });
  },

  getStats: async () => {
    return new Promise<ContractStats>((resolve) => {
      setTimeout(() => resolve(DUMMY_STATS), 500);
    });
  },
};
