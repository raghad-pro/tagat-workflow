import { GenericStatus } from "@/types/Shared.types";

export interface Project {
  id: number;
  title: string;
  company: string;
  client: string;
  budget: string;
  employees: string;
  status: GenericStatus;
}

export interface ProjectStats {
  totalProjects: { value: number; label: string };
  inProgress: { value: number; label: string };
  completed: { value: number; label: string };
}

export interface ProjectsQueryParams {
  page?: number;
  search?: string;
  per_page?: number;
}
