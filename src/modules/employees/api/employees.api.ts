import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type { Employee, EmployeeStats, EmployeesQueryParams } from "../types/employees.types";

export const employeeApi = {
  getAll: async (role: string, params?: EmployeesQueryParams) => {
    // `apiClient.get` wraps its second argument as axios `{ params }` itself;
    // passing `{ params }` produced `?params[page]=…`, which the server ignores.
    const response = await apiClient.get(
      `${getRolePrefix(role)}/employees`,
      params as Record<string, unknown>
    );
    const payload = (response as any).data;

    if (Array.isArray(payload)) {
      return { data: payload, meta: { total: payload.length } };
    }

    return {
      data: payload?.data || [],
      meta: payload?.meta || { total: payload?.data?.length || payload?.total || 0 },
    };
  },

  getAvailableUsers: async (role: string) => {
    const response = await apiClient.get(`${getRolePrefix(role)}/availbale-user`);
    const payload = (response as any).data;
    
    const items = Array.isArray(payload) ? payload : (payload?.data || []);
    // Map bare User objects to ensure resolveUserId finds the user_id
    const mapped = items.map((u: any) => ({
      ...u,
      user_id: u.user_id ?? u.id
    }));

    if (Array.isArray(payload)) {
      return { data: mapped, meta: { total: mapped.length } };
    }

    return {
      data: mapped,
      meta: payload?.meta || { total: mapped.length || payload?.total || 0 },
    };
  },

  /**
   * Every employee, across all pages.
   *
   * The list endpoint caps its page size at 10 and ignores `per_page`, so a
   * single request cannot return the whole roster. Screens that must reason
   * about all employees at once — the access screen filters and counts by role
   * — have to walk the paginator instead of asking for a big page.
   */
  getAllPages: async (role: string, params?: EmployeesQueryParams) => {
    const url = `${getRolePrefix(role)}/employees`;

    const fetchPage = async (page: number) => {
      const response = await apiClient.get(url, {
        ...(params as Record<string, unknown>),
        page,
      });
      return (response as any).data;
    };

    const first = await fetchPage(1);
    if (Array.isArray(first)) return { data: first, meta: { total: first.length } };

    const rows: any[] = Array.isArray(first?.data) ? [...first.data] : [];
    const lastPage = Number(first?.last_page ?? 1);

    // Bounded so a server that always reports more pages cannot spin forever.
    const maxPages = Math.min(lastPage, 50);
    for (let page = 2; page <= maxPages; page++) {
      const next = await fetchPage(page);
      const nextRows = Array.isArray(next?.data) ? next.data : [];
      if (nextRows.length === 0) break;
      rows.push(...nextRows);
    }

    return { data: rows, meta: { total: Number(first?.total ?? rows.length) } };
  },

  /**
   * Counted over every page, and off `user.is_active` rather than a `status`
   * column that does not exist on the record — reading `e.status` gave
   * `undefined` for every row, so "active" fell through to the total and
   * "onboarding" was always zero.
   */
  getStats: async (role: string): Promise<EmployeeStats> => {
    const res = await employeeApi.getAllPages(role);
    const employees = res.data;
    const isActive = (e: any) => Number(e?.user?.is_active ?? e?.is_active ?? 1) === 1;

    return {
      total:    res.meta.total || employees.length,
      active:   employees.filter(isActive).length,
      inactive: employees.filter((e: any) => !isActive(e)).length,
    };
  },

  create: async (role: string, data: Partial<Employee>) => {
    const response = await apiClient.post(`${getRolePrefix(role)}/employees`, data);
    return (response as any).data;
  },

  update: async (role: string, id: number | string, data: Partial<Employee>) => {
    const response = await apiClient.put(`${getRolePrefix(role)}/employees/${id}`, data);
    return (response as any).data;
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${getRolePrefix(role)}/employees/${id}`);
    return (response as any).data;
  },

  getCompanyData: async (role: string, companyId?: string | number) => {
    const url = companyId
      ? `${getRolePrefix(role)}/company-data/${companyId}`
      : `${getRolePrefix(role)}/company-data`;
    const response = await apiClient.get(url);
    return (response as any).data;
  },

  getCompanyCurrencies: async (role: string, companyId?: string | number) => {
    if (role === "super_admin" && !companyId) return { data: [] };
    const url =
      role === "super_admin"
        ? `${getRolePrefix(role)}/companies/${companyId}/currencies`
        : `${getRolePrefix(role)}/currencies`;
    try {
      const response = await apiClient.get(url);
      return (response as any).data;
    } catch {
      return { data: [] };
    }
  },
};