"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { taskApi } from "../api/tasks.api";
import type { TasksQueryParams } from "../types/tasks.types";

export const useTasks = (params: TasksQueryParams) => {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => taskApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: () => taskApi.getStats(),
  });
};
