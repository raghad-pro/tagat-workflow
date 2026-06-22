import type { Development, DevelopmentStats, DevelopmentsQueryParams } from "../types/developments.types";
import { DUMMY_DEVELOPMENTS, DUMMY_STATS } from "../data/mockData";

export const developmentApi = {
  getAll: async (params?: DevelopmentsQueryParams) => {
    return new Promise<{ data: Development[]; meta: { total: number } }>((resolve) => {
      setTimeout(() => {
        let filtered = [...DUMMY_DEVELOPMENTS];
        if (params?.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.client.toLowerCase().includes(q) ||
              d.project.toLowerCase().includes(q)
          );
        }
        
        const page = params?.page || 1;
        const perPage = params?.per_page || 5;
        const start = (page - 1) * perPage;
        const paginated = filtered.slice(start, start + perPage);

        resolve({
          data: paginated,
          meta: { total: filtered.length },
        });
      }, 500);
    });
  },

  getStats: async () => {
    return new Promise<DevelopmentStats>((resolve) => {
      setTimeout(() => {
        resolve(DUMMY_STATS);
      }, 300);
    });
  },
};
