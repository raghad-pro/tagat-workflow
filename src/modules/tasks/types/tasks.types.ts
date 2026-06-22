export interface Task {
  id: number;
  company: string;
  title: string;
  project: string;
  employee: string;
  start: string;
  end: string;
  duration: string;
  budget: string;
}

export interface TaskStats {
  activeTasks: { value: number; label: string };
  loggedHours: { value: string; label: string };
  budgetUtilization: { value: string; label: string };
}

export interface TasksQueryParams {
  page?: number;
  search?: string;
  per_page?: number;
}
