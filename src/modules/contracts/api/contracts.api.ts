import type { Contract, ContractStats, ContractsQueryParams } from "../types/contracts.types";
import { DUMMY_CONTRACTS, DUMMY_STATS } from "../data/mockData";

export const contractApi = {
  getAll: async (params?: ContractsQueryParams) => {
    let filtered = DUMMY_CONTRACTS;

    if (params?.search) {
      filtered = filtered.filter((c) =>
        c.customerName.toLowerCase().includes(params.search!.toLowerCase())
      );
    }

    return { data: filtered, total: filtered.length };
  },

  getStats: async () => DUMMY_STATS,
};