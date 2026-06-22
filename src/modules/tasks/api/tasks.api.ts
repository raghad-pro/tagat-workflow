import type { Task, TaskStats, TasksQueryParams } from "../types/tasks.types";
import { DUMMY_TASKS, DUMMY_STATS } from "../data/mockData";

export const taskApi = {
  getAll: async (params?: TasksQueryParams) => {
    return new Promise<{ data: Task[]; total: number }>((resolve) => {
      setTimeout(() => {
        let filtered = DUMMY_TASKS;
        if (params?.search) {
          filtered = filtered.filter((t) =>
            t.title.toLowerCase().includes(params.search!.toLowerCase())
          );
        }
        resolve({ data: filtered, total: filtered.length });
      }, 500);
    });
  },

  getStats: async () => {
    return new Promise<TaskStats>((resolve) => {
      setTimeout(() => resolve(DUMMY_STATS), 500);
    });
  },
};
