// import { GenericStatus } from "@/types/Shared.types";

// export interface Project {
//   id: number;
//   title: string;
//   company: string;
//   client: string;
//   budget: string;
//   employees: string;
//   status: GenericStatus;
// }

// export interface ProjectStats {
//   totalProjects: { value: number; label: string };
//   inProgress: { value: number; label: string };
//   completed: { value: number; label: string };
// }

// export interface ProjectsQueryParams {
//   page?: number;
//   search?: string;
//   per_page?: number;
// }
import { GenericStatus } from "@/types/Shared.types";

export interface Project {
  id: number;
  title: string;
  name?: string;           // some API responses use `name` instead of `title`
  company: string | object;
  company_id?: number | string;
  client: string | object;
  client_id?: number | string;
  budget: string | number;
  employees: string | number | any[];
  status: GenericStatus;
}

export interface ProjectStats {
  totalProjects: { value: number; label: string };
  inProgress:    { value: number; label: string };
  completed:     { value: number; label: string };
}

export interface ProjectsQueryParams {
  page?:     number;
  search?:   string;
  per_page?: number;
}