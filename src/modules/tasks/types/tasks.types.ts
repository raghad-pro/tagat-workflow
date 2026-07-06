import type { GenericStatus } from "@/types/Shared.types";

// ─── Project reference ─────────────────────────────────────────────────────────
export interface TaskProject {
  id:      number;
  title?:  string;
  name?:   string;
  budget?: string;
  company?: {
    id:   number;
    name: string;
  };
}

// ─── Company reference ─────────────────────────────────────────────────────────
export interface TaskCompany {
  id:   number;
  name: string;
}

// ─── Employee reference ────────────────────────────────────────────────────────
export interface TaskEmployee {
  id:             number;
  user_id?:       number;
  name?:          string;
  employee_name?: string;
  user?:          { name: string };
}

// ─── Task ──────────────────────────────────────────────────────────────────────
export interface Task {
  id:          number;
  title:       string;
  // Project — may be object or string
  project?:    TaskProject | string;
  project_id?: number;
  // Employee — may be object, string, or number
  employee?:   TaskEmployee | string | number;
  assigned_to?: number | TaskEmployee;
  assignedTo?:  number | TaskEmployee;
  // Company — may be object or string
  company?:    TaskCompany | string;
  company_id?: number;
  // Time
  start?:      string;
  end?:        string;
  start_time?: string;
  end_time?:   string;
  task_date?:  string;
  taskDate?:   string;
  duration?:   string;
  // Financial
  budget?:     string;
  // Status
  status?:     GenericStatus | "pending" | "in_progress" | "completed";
  description?: string;
  // Users array (some endpoints return array)
  users?:      Array<{ id: number; name?: string; user?: { name: string } }>;
  employees?:  Array<{ id: number; name?: string; user?: { name: string } }>;
}

// ─── Stats ─────────────────────────────────────────────────────────────────────
export interface TaskStats {
  activeTasks:       { value: number; label: string };
  loggedHours:       { value: string; label: string };
  budgetUtilization: { value: string; label: string };
}

// ─── Query Params ──────────────────────────────────────────────────────────────
export interface TasksQueryParams {
  page?:     number;
  search?:   string;
  per_page?: number;
}