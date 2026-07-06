"use client";

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { projectApi } from "../api/projects.api";
import type { Project, ProjectsQueryParams } from "../types/projects.types";
import { useAuth } from "@/providers/AuthProvider";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";

export const useProjects = (params: ProjectsQueryParams) => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["projects", role, params],
    queryFn: () => projectApi.getAll(role, params),
    placeholderData: keepPreviousData,
  });
};

export const useProjectStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["project-stats", role],
    queryFn: () => projectApi.getStats(role),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: (data: Partial<Project>) => projectApi.create(role, data),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تمت إضافة المشروع بنجاح" : "Project created successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Project> }) => projectApi.update(role, id, data),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم تعديل المشروع بنجاح" : "Project updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";
  const locale = useLocale();

  return useMutation({
    mutationFn: (id: string | number) => projectApi.delete(role, id),
    onSuccess: () => {
      toast.success(locale === "ar" ? "تم حذف المشروع بنجاح" : "Project deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-stats"] });
      queryClient.invalidateQueries({ queryKey: ["tasks-data"] });
    },
  });
};
