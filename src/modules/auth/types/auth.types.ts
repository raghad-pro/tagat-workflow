export type Role = "super_admin" | "company" | "employee" | "client";

/**
 * The four seeded roles. One of them is always a user's base role and decides
 * which dashboard they land on; anything else is a custom role that only adds
 * permissions.
 *
 * Duplicated from `@/modules/roles/types/roles.types` on purpose — auth is
 * bootstrapped before any feature module and must not depend on one.
 */
const BASE_ROLE_IDS = [1, 2, 3, 4];

// role_id → Role mapping (من الـ API بييجي رقم)
export const ROLE_MAP: Record<number, Role> = {
  1: "super_admin",
  2: "company",
  3: "employee",
  4: "client",
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  role_id: number;
  company_id: number | null;
  is_active: number;
  image: string | null;
  /**
   * Every role attached to the account: the base one plus any custom role
   * granted through the access screen. Needed to look their permissions up,
   * since the login response carries roles but not permissions.
   */
  role_ids: number[];
  /**
   * Flattened permission names (`"invoices.create"`) across all of those
   * roles. `undefined` means "not resolved yet" — which is not the same as
   * "none", and `usePermission` treats it as unrestricted. See AuthProvider.
   */
  permissions?: string[];
};

/**
 * The API does not send a scalar role — it sends a Spatie-style relation, e.g.
 * `role: [{ id: 1, name: "super_admin", pivot: { role_id: 1 } }]`. Passing that
 * straight to `String()` yields "[object Object]", which matched nothing and
 * silently fell through to the "company" default, so every super admin was
 * downgraded on login. This flattens the array/object forms to `{ name, id }`.
 */
function extractRoleSource(roleInput: any): { name?: string; id?: number } {
  if (roleInput === null || roleInput === undefined) return {};

  // `roles: [...]` / `role: [...]` — a user may now hold several roles: the
  // seeded one that decides which dashboard they get, plus a custom role that
  // only adds permissions. Pick the seeded one explicitly.
  //
  // This used to take the lowest id, which happened to work only because
  // custom roles are numbered above 4. Matching the known base ids instead
  // keeps it correct no matter how the ids are handed out.
  if (Array.isArray(roleInput)) {
    const entries = roleInput
      .map((entry) => extractRoleSource(entry))
      .filter((entry) => entry.name || entry.id !== undefined);
    if (entries.length === 0) return {};

    const base = entries.find(
      (entry) => entry.id !== undefined && BASE_ROLE_IDS.includes(entry.id)
    );
    if (base) return base;

    return entries.reduce((best, entry) =>
      (entry.id ?? Number.MAX_SAFE_INTEGER) < (best.id ?? Number.MAX_SAFE_INTEGER) ? entry : best
    );
  }

  if (typeof roleInput === "object") {
    const id = roleInput.id ?? roleInput.role_id ?? roleInput.pivot?.role_id;
    return {
      name: roleInput.name ?? roleInput.role ?? roleInput.slug,
      id: id === undefined || id === null ? undefined : Number(id),
    };
  }

  if (typeof roleInput === "number") return { id: roleInput };
  return { name: String(roleInput) };
}

export function normalizeRole(roleInput: any, roleIdInput?: any): Role {
  const roleIdMap: Record<number, Role> = {
    1: "super_admin",
    2: "company",
    3: "employee",
    4: "client",
  };

  const source = extractRoleSource(roleInput);

  // The role *name* is the most explicit signal, so it is checked first —
  // a stale numeric id must not override it.
  const name = source.name;
  if (name) {
    const s = String(name).toLowerCase().trim();
    if (s === "super_admin" || s === "superadmin" || s === "admin" || s === "super_admin_role") return "super_admin";
    if (s === "company" || s === "company_admin" || s === "companyadmin" || s === "company_request" || s === "company_user") return "company";
    if (s === "employee" || s === "staff") return "employee";
    if (s === "client" || s === "customer") return "client";
  }

  const explicitId = roleIdInput ?? source.id;
  if (explicitId !== undefined && explicitId !== null) {
    const mapped = roleIdMap[Number(explicitId)];
    if (mapped) return mapped;
  }

  return "company";
}

/** Reads the role off a user object regardless of which shape the API used. */
export function resolveUserRole(u: any, rawPayload?: any): Role {
  const roleSource =
    u?.role ?? u?.roles ?? rawPayload?.role ?? rawPayload?.roles ?? undefined;
  const roleId = u?.role_id ?? u?.roleId ?? rawPayload?.role_id;
  return normalizeRole(roleSource, roleId);
}

/**
 * Every role id on the account, base and custom alike.
 *
 * These are the ids whose permissions get fetched and merged after login —
 * the login response itself carries no permissions at all.
 */
export function resolveRoleIds(u: any, rawPayload?: any): number[] {
  const sources = [u?.roles, u?.role, rawPayload?.roles, rawPayload?.role];
  const ids = new Set<number>();

  for (const source of sources) {
    if (!source) continue;
    for (const entry of Array.isArray(source) ? source : [source]) {
      const raw =
        typeof entry === "object" && entry !== null
          ? (entry.id ?? entry.role_id ?? entry.pivot?.role_id)
          : entry;
      const id = Number(raw);
      if (Number.isFinite(id) && id > 0) ids.add(id);
    }
  }

  const scalar = Number(u?.role_id ?? rawPayload?.role_id);
  if (Number.isFinite(scalar) && scalar > 0) ids.add(scalar);

  return Array.from(ids);
}

export function normalizeUser(rawUser: any, rawPayload?: any): User | null {
  if (!rawUser && !rawPayload) return null;

  const u = rawUser || rawPayload?.user || rawPayload?.company || rawPayload?.admin || rawPayload?.client || rawPayload?.employee || rawPayload?.company_request || rawPayload?.data?.user || rawPayload?.data?.company || rawPayload;

  if (!u || typeof u !== "object") return null;

  const id = u.id ?? u.user_id ?? rawPayload?.id ?? rawPayload?.user_id;
  const email = u.email ?? rawPayload?.email ?? "";
  const name = u.name ?? u.company_name ?? rawPayload?.name ?? rawPayload?.company_name ?? "User";
  const role_id = u.role_id ?? rawPayload?.role_id ?? u.roleId;
  // Reads `role`/`roles` in array, object or scalar form — the API sends an array.
  const role = resolveUserRole(u, rawPayload);

  if (!id || !email) {
    return null;
  }

  return {
    id: Number(id),
    name: String(name),
    email: String(email),
    role,
    role_id: Number(role_id || (role === "super_admin" ? 1 : role === "company" ? 2 : role === "employee" ? 3 : 4)),
    company_id: u.company_id ?? rawPayload?.company_id ?? (role === "company" ? Number(id) : null),
    is_active: u.is_active ?? rawPayload?.is_active ?? 1,
    image: u.image ?? u.logo ?? u.avatar ?? null,
    role_ids: resolveRoleIds(u, rawPayload),
    // Preserved when re-normalizing an already-resolved user (e.g. reading it
    // back from localStorage) so the resolution is not thrown away.
    permissions: Array.isArray(u.permissions) ? u.permissions : undefined,
  };
}

// ─── Auth Requests ──────────────────────────────────────────────────────────────

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  account_type: "company" | "client";
  company_name?: string; 
  domain?: string;
  logo?: File | null;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  otp: string;
  password: string;
  password_confirmation: string;
};

// ─── Auth Responses ─────────────────────────────────────────────────────────────

// الـ raw response كما يجي من الـ API
export type ApiAuthResponse = {
  success: boolean;
  message: string;
  data: {
    user: Omit<User, "role"> & { role_id: number };
     role: Role;
    token: string;
    token_type: string;
  };
};

// الـ normalized response اللي بنستخدمه داخل الـ app
export type AuthResponse = {
  token: string;
  user: User;
};

export type MessageResponse = {
  message: string;
  success?: boolean;
};

export type VerifyOtpResponse = {
  valid: boolean;
  reset_token: string;
};