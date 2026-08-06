/**
 * Shapes below mirror what the API actually returns, verified against
 * `GET /{role}/roles`, `/roles/{id}` and `/roles/form-permissions`.
 */

/** A single grantable permission. `name` is always `"<group>.<action>"`. */
export interface Permission {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  /** Present only when the permission arrives through a role relation. */
  pivot?: { role_id: number; permission_id: number };
}

/** Minimal company shape embedded in a role. */
export interface RoleCompany {
  id: number;
  name: string;
  domain?: string | null;
  logo?: string | null;
}

export interface Role {
  id: number;
  /** `null` for the global base roles; a company id for custom roles. */
  company_id: number | null;
  name: string;
  description: string | null;
  /**
   * Unreliable — every base role reports 0 while some junk rows report 1.
   * Use `isBaseRole(id)` instead of reading this.
   */
  is_system?: number | boolean;
  created_at?: string;
  updated_at?: string;
  permissions?: Permission[];
  company?: RoleCompany | null;
  /** Returned by create/update, not by the list endpoint. */
  users?: unknown[];
}

/** Payload accepted by `POST /roles` and `PUT /roles/{id}`. */
export interface RolePayload {
  name: string;
  description?: string | null;
  company_id?: number | null;
  /** Full replacement set — see `roleApi.update`. */
  permissions?: number[];
}

export interface RoleStats {
  total: number;
  systemRoles: number;
  customRoles: number;
}

export interface RolesQueryParams {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface RolesListResult {
  data: Role[];
  meta: { total: number };
}

/** `GET /roles/form-permissions` */
export interface FormPermissions {
  is_super_admin: boolean;
  permissions: Permission[];
}

/** `GET /employees/company/{id}/roles` */
export interface CompanyRoleOption {
  id: number;
  name: string;
}

/**
 * Seeded roles every account is built on. They cannot be edited or deleted,
 * and one of them is always a user's base role.
 *
 * Matched by id on purpose: `is_system` reports 0 for all four of them, so the
 * flag cannot be used to tell a base role from a custom one.
 */
export const BASE_ROLE_IDS = [1, 2, 3, 4] as const;

export const isBaseRole = (id: number | string | undefined | null): boolean =>
  BASE_ROLE_IDS.includes(Number(id) as (typeof BASE_ROLE_IDS)[number]);

/** Permission names granted by a role, deduplicated. */
export const permissionNames = (role?: Role | null): string[] =>
  Array.from(new Set((role?.permissions ?? []).map((p) => p.name)));
