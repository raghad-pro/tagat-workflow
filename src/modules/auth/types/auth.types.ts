export type Role = "super_admin" | "company" | "employee" | "client";

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
};

export function normalizeRole(roleInput: any, roleIdInput?: any): Role {
  if (roleIdInput !== undefined && roleIdInput !== null) {
    const roleIdMap: Record<number, Role> = {
      1: "super_admin",
      2: "company",
      3: "employee",
      4: "client",
    };
    const rId = Number(roleIdInput);
    if (roleIdMap[rId]) {
      return roleIdMap[rId];
    }
  }

  if (roleInput) {
    const s = String(roleInput).toLowerCase().trim();
    if (s === "super_admin" || s === "superadmin" || s === "admin" || s === "super_admin_role") return "super_admin";
    if (s === "company" || s === "company_admin" || s === "companyadmin" || s === "company_request" || s === "company_user") return "company";
    if (s === "employee" || s === "staff") return "employee";
    if (s === "client" || s === "customer") return "client";
  }

  return "company";
}

export function normalizeUser(rawUser: any, rawPayload?: any): User | null {
  if (!rawUser && !rawPayload) return null;

  const u = rawUser || rawPayload?.user || rawPayload?.company || rawPayload?.admin || rawPayload?.client || rawPayload?.employee || rawPayload?.company_request || rawPayload?.data?.user || rawPayload?.data?.company || rawPayload;

  if (!u || typeof u !== "object") return null;

  const id = u.id ?? u.user_id ?? rawPayload?.id ?? rawPayload?.user_id;
  const email = u.email ?? rawPayload?.email ?? "";
  const name = u.name ?? u.company_name ?? rawPayload?.name ?? rawPayload?.company_name ?? "User";
  const role_id = u.role_id ?? rawPayload?.role_id ?? u.roleId;
  const role = normalizeRole(u.role || rawPayload?.role, role_id);

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