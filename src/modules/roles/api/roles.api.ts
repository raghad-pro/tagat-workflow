import apiClient from "@/services/apiClient";
import { getRolePrefix } from "@/utils/rolePrefix";
import type {
  Role,
  RolePayload,
  RoleStats,
  RolesQueryParams,
  RolesListResult,
  FormPermissions,
  CompanyRoleOption,
} from "../types/roles.types";
import { isBaseRole } from "../types/roles.types";

const base = (role: string) => `${getRolePrefix(role)}/roles`;

/** Unwraps `{ success, message, data }` once. */
function body<T>(response: unknown): T {
  return (response as { data: T })?.data as T;
}

/**
 * `GET /roles` responds with a Laravel paginator nested under `data`, so the
 * rows are at `data.data` and the row count at `data.total` — there is no
 * `meta` object. Reading `meta.total` returned the length of the current page,
 * which pinned the pager to a single page.
 */
function unwrapList(payload: any): RolesListResult {
  if (Array.isArray(payload)) {
    return { data: payload, meta: { total: payload.length } };
  }

  const rows: Role[] = Array.isArray(payload?.data) ? payload.data : [];
  const total =
    payload?.total ?? payload?.meta?.total ?? payload?.data?.total ?? rows.length;

  return { data: rows, meta: { total: Number(total) || rows.length } };
}

export const roleApi = {
  getAll: async (role: string, params?: RolesQueryParams): Promise<RolesListResult> => {
    // `apiClient.get` wraps its second argument as axios `{ params }` itself —
    // passing `{ params }` here serialised the query as `?params[search]=…`,
    // so search and pagination never reached the server.
    const response = await apiClient.get(base(role), params as Record<string, unknown>);
    return unwrapList(body<any>(response));
  },

  getById: async (role: string, id: number | string): Promise<Role> => {
    const response = await apiClient.get(`${base(role)}/${id}`);
    return body<Role>(response);
  },

  /** The grantable catalog — scoped per role by the server. */
  getFormPermissions: async (role: string): Promise<FormPermissions> => {
    const response = await apiClient.get(`${base(role)}/form-permissions`);
    const payload = body<FormPermissions>(response);
    return {
      is_super_admin: Boolean(payload?.is_super_admin),
      permissions: Array.isArray(payload?.permissions) ? payload.permissions : [],
    };
  },

  getStats: async (role: string): Promise<RoleStats> => {
    const { data, meta } = await roleApi.getAll(role, { per_page: 200 });
    const systemRoles = data.filter((r) => isBaseRole(r.id)).length;
    return {
      total: meta.total || data.length,
      systemRoles,
      customRoles: Math.max((meta.total || data.length) - systemRoles, 0),
    };
  },

  create: async (role: string, data: RolePayload): Promise<Role> => {
    const response = await apiClient.post(base(role), data);
    return body<Role>(response);
  },

  /**
   * The endpoint replaces rather than patches: a request without
   * `permissions` clears every permission on the role, and one without
   * `description` nulls it. Both fields are therefore always sent, so callers
   * must pass the complete permission set — not a delta.
   */
  update: async (role: string, id: number | string, data: RolePayload): Promise<Role> => {
    const response = await apiClient.put(`${base(role)}/${id}`, {
      ...data,
      description: data.description ?? null,
      permissions: data.permissions ?? [],
    });
    return body<Role>(response);
  },

  delete: async (role: string, id: number | string) => {
    const response = await apiClient.delete(`${base(role)}/${id}`);
    return body(response);
  },

  /**
   * Roles a company's employees may be given.
   *
   * Returns only roles whose `company_id` matches, which is the sole thing
   * keeping one company's roles out of another's employees — the update
   * endpoint itself accepts a foreign `role_id` without complaint.
   */
  getCompanyRoles: async (
    role: string,
    companyId: number | string
  ): Promise<CompanyRoleOption[]> => {
    const response = await apiClient.get(
      `${getRolePrefix(role)}/employees/company/${companyId}/roles`
    );
    const payload = body<any>(response);
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.data) ? payload.data : [];
  },
};
