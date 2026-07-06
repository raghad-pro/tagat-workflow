"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { taskApi } from "../api/tasks.api";
import type { TasksQueryParams } from "../types/tasks.types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "next-intl";

export const useTasks = (params: TasksQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["tasks", role, params],
    queryFn: () => taskApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useTaskStats = () => {
  return useQuery({
    queryKey: ["task-stats"],
    queryFn: () => taskApi.getStats(),
  });
};

export const useTasksData = (companyId?: number) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["tasks-data", role, companyId],
    queryFn: () => taskApi.getTasksData(role, companyId),
    enabled: role === "super_admin" ? !!companyId : true,
  });
};

export const useProjectEmployees = (projectId: number | null) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["project-employees", role, projectId],
    queryFn: () => taskApi.getProjectEmployees(role, projectId!),
    enabled: !!projectId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: (data: Record<string, any>) => taskApi.create(role, data),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تمت إضافة المهمة بنجاح" : "Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, any> }) => taskApi.update(role, id, data),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم تعديل المهمة بنجاح" : "Task updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: (id: number) => taskApi.delete(role, id),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم حذف المهمة بنجاح" : "Task deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task-stats"] });
    },
  });
};
