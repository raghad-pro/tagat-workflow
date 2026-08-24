"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employees.api";
import { useAuth } from "@/providers/AuthProvider";
import { isBaseRole } from "@/modules/roles/types/roles.types";

/**
 * Every employee, for the access screen.
 *
 * Uses the paging walk rather than `useEmployees`: the list endpoint caps
 * pages at 10 rows and ignores `per_page`, and this screen counts and filters
 * across the whole roster — a truncated list would quietly under-report who
 * has which role.
 */
export const useAllEmployees = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  const query = useQuery({
    queryKey: ["employees", "all", role],
    queryFn: () => employeeApi.getAllPages(role),
  });

  return { ...query, data: query.data?.data ?? [] };
};

/** A role attached to an employee's user account. */
export interface AttachedRole {
  id: number;
  name: string;
}

/**
 * Reads the roles off an employee row. The API nests them at
 * `employee.user.roles[]`; the shape is the same on list and detail.
 */
export function getEmployeeRoles(employee: any): AttachedRole[] {
  const roles = employee?.user?.roles ?? employee?.roles ?? [];
  if (!Array.isArray(roles)) return [];
  return roles
    .map((r: any) => ({ id: Number(r?.id), name: String(r?.name ?? "") }))
    .filter((r) => Number.isFinite(r.id));
}

/**
 * The extra role granted on top of the base one, if any.
 *
 * Every user carries exactly one of the four seeded roles (`employee`,
 * `client`, …); anything else is the custom role this feature assigns. The API
 * models the relation as many-to-many but `role_id` only ever attaches one, so
 * the first non-base entry is the answer.
 */
export function getExtraRole(employee: any): AttachedRole | null {
  return getEmployeeRoles(employee).find((r) => !isBaseRole(r.id)) ?? null;
}

export function getBaseRole(employee: any): AttachedRole | null {
  return getEmployeeRoles(employee).find((r) => isBaseRole(r.id)) ?? null;
}

/**
 * Rebuilds the employee's current values so an update can carry `role_id`
 * without dropping anything else.
 *
 * `PUT /employees/{id}` replaces rather than patches — a field left out of the
 * body is cleared. Sending only `role_id` would therefore wipe the job title,
 * rate and currency.
 */
export function buildEmployeePayload(
  employee: any,
  roleId: number | null
): Record<string, unknown> {
  const paymentType = employee?.payment_type ?? employee?.paymentType ?? null;
  const toNumber = (v: unknown) =>
    v === null || v === undefined || v === "" ? null : Number(v);

  return {
    name: employee?.user?.name ?? employee?.name ?? employee?.employee_name ?? "",
    job_title: employee?.job_title ?? employee?.jobTitle ?? "",
    payment_type: paymentType,
    hourly_rate: toNumber(employee?.hourly_rate ?? employee?.hourlyRate),
    monthly_salary: toNumber(employee?.monthly_salary ?? employee?.monthlySalary),
    currency_id: toNumber(employee?.currency_id ?? employee?.currency?.id),
    // Preserve the active status when updating other fields
    is_active: employee?.user?.is_active ?? employee?.is_active ?? 1,
    // Always explicit. Omitting the key detaches the role just as `null` does,
    // so "leave it alone" is not something this endpoint can express.
    role_id: roleId,
  };
}

/** Assigns (or clears, with `roleId: null`) the extra role on one employee. */
export const useAssignRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: ({ employee, roleId }: { employee: any; roleId: number | null }) =>
      employeeApi.update(role, employee.id, buildEmployeePayload(employee, roleId) as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
    },
  });
};

/**
 * Applies one role to several employees.
 *
 * Runs sequentially: there is no bulk endpoint, and firing a dozen writes at
 * once against this server is a good way to get some of them dropped. Failures
 * are collected rather than thrown so a partial result can be reported
 * honestly instead of looking like a total failure.
 */
export const useBulkAssignRole = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: async ({
      employees,
      roleId,
    }: {
      employees: any[];
      roleId: number | null;
    }) => {
      const failed: { name: string; message: string }[] = [];

      for (const employee of employees) {
        try {
          await employeeApi.update(
            role,
            employee.id,
            buildEmployeePayload(employee, roleId) as any
          );
        } catch (err: any) {
          failed.push({
            name: employee?.user?.name ?? employee?.name ?? String(employee?.id),
            message: err?.response?.data?.message || err?.message || "",
          });
        }
      }

      return { total: employees.length, failed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["employeeStats"] });
    },
  });
};

