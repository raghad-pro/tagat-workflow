"use client";

import { useQuery } from "@tanstack/react-query";

import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { useAuth } from "@/providers/AuthProvider";

/**
 * A timesheet row derived from a completed task rather than stored by the API.
 *
 * Shaped like a real timesheet — same field names, and `hours` in minutes like
 * the stored column — so the table can render both without branching.
 */
export interface DerivedTimesheetRow {
  /** Prefixed so it can never collide with a stored timesheet's numeric id. */
  id: string;
  /** Marks the row as derived: it has no database row behind it. */
  __source: "task";
  task_id: number;
  user_id: number;
  date: string;
  /** Minutes, matching the stored `hours` column's actual unit. */
  hours: number;
  rate: number | string;
  total: number | string;
  status: "completed";
  user: any;
  task: { id: number; title: string; sprint?: any; project?: any };
}

/**
 * Every task, across all pages.
 *
 * The list endpoint pages at 10 and ignores `per_page` (same as `/employees`),
 * so a single request would silently report only the first ten tasks.
 */
async function fetchAllTasks(role: string): Promise<any[]> {
  const url = `${getRolePrefix(role)}/tasks`;

  const readPage = async (page: number) => {
    const res = await apiClient.get<any>(url, { page });
    const payload = res?.data;
    const rows = Array.isArray(payload) ? payload : (payload?.data ?? []);
    const lastPage = Array.isArray(payload) ? 1 : (payload?.last_page ?? 1);
    return { rows: Array.isArray(rows) ? rows : [], lastPage };
  };

  const first = await readPage(1);
  const all = [...first.rows];

  for (let page = 2; page <= first.lastPage; page++) {
    const next = await readPage(page);
    all.push(...next.rows);
    // The paginator is authoritative, but guard against a runaway loop if the
    // server ever reports a `last_page` it cannot actually serve.
    if (next.rows.length === 0) break;
  }

  return all;
}

const toNumber = (value: unknown): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Completed tasks, presented as timesheet entries.
 *
 * The backend never turns a finished task into a timesheet: `POST /timesheets`
 * is not a route at all ("Supported methods: GET, HEAD"), and completing a task
 * through `kanban/update-status` — verified against the live API, with and
 * without a sprint — leaves the timesheet table untouched. The work is
 * nonetheless fully recorded on the task itself (`duration`, `cost`,
 * `task_date`, `assigned_to`), so the hours an employee logged are derived from
 * there instead of being invented.
 *
 * Derived rows are read-only by nature — approve/reject need a real row id.
 */
export function useCompletedTaskEntries() {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["timesheets", "from-tasks", role],
    queryFn: async (): Promise<DerivedTimesheetRow[]> => {
      const [tasks, employees] = await Promise.all([
        fetchAllTasks(role),
        employeeApi.getAllPages(role).then((r) => r.data ?? []),
      ]);

      // `user.employee` is what the table reads for rate, currency and payment
      // type, so derived rows have to carry the same nesting.
      const employeeByUserId = new Map<number, any>();
      employees.forEach((e: any) => {
        const uid = Number(e?.user_id ?? e?.user?.id);
        if (Number.isFinite(uid)) employeeByUserId.set(uid, e);
      });

      return tasks
        .filter((task: any) => String(task?.status) === "completed")
        .map((task: any) => {
          const userId = Number(task?.assigned_to ?? task?.assigned_user?.id);
          const employee = employeeByUserId.get(userId);
          const minutes = toNumber(task?.duration);
          const total = toNumber(task?.cost);

          // The task carries the money and the minutes but not the rate, so
          // recover it from the two — falling back to the employee record when
          // a task has no duration to divide by.
          const derivedRate =
            minutes > 0 ? total / (minutes / 60) : toNumber(employee?.hourly_rate);

          return {
            id: `task-${task.id}`,
            __source: "task" as const,
            task_id: Number(task.id),
            user_id: userId,
            date: task?.task_date ?? task?.updated_at?.split("T")[0] ?? "",
            hours: minutes,
            rate: Number(derivedRate.toFixed(2)),
            total,
            status: "completed" as const,
            user: {
              ...(task?.assigned_user ?? {}),
              name: task?.assigned_user?.name ?? task?.assigned_user_name ?? "—",
              company: task?.project?.company ?? employee?.company,
              employee,
            },
            task: {
              id: Number(task.id),
              title: task?.title ?? "",
              sprint: task?.sprint,
              project: task?.project,
            },
          };
        });
    },
    staleTime: 60 * 1000,
  });
}
