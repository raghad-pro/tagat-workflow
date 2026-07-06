import apiClient from "@/services/apiClient";
import type { Role } from "@/modules/auth/types/auth.types";

// ─── Response Shapes ──────────────────────────────────────────────────────────
export interface ProfileApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface SuperAdminProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  role_id: number;
  is_active: number;
  image: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyAdminProfile {
  id: number;
  name: string;
  email: string;
  domain: string;
  logo: string | null;
  role?: string;
  role_id?: number;
  created_at: string;
  updated_at: string;
}

export interface EmployeeProfile {
  id: number;
  name: string;
  employee_name?: string;
  email?: string;
  job_title?: string;
  payment_type?: string;
  salary?: string | number;
  currency?: { id: number; name: string; code: string } | string;
  company?: { id: number; name: string } | string;
  status?: string;
  image?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
  created_at: string;
  updated_at: string;
}

export interface ClientProfile {
  id: number;
  name: string;
  credit_limit?: number | null;
  is_primary?: number;
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
    image: string | null;
  };
  companies?: Array<{
    id: number;
    name: string;
    email: string;
    domain: string;
    pivot?: { status: string };
  }>;
  created_at: string;
  updated_at: string;
}

// ─── Update Payloads ──────────────────────────────────────────────────────────
export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  image?: string | null;
}

export interface UpdatePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const getPrefix = (role: Role): string => {
  switch (role) {
    case "super_admin":   return "/super_admin";
    case "company": return "/company";
    case "employee":      return "/employee";
    case "client":        return "/client";
    default:              return "";
  }
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const profileApi = {
  /** GET /account — returns current user's profile based on token role */
  getProfile: async (role: Role) => {
    const prefix = getPrefix(role);
    const res = await apiClient.get<ProfileApiResponse>(`${prefix}/account`);
    return res.data;
  },

  /** POST /account/update — update basic info */
  updateProfile: async (role: Role, payload: UpdateProfilePayload) => {
    const prefix = getPrefix(role);
    const res = await apiClient.post<ProfileApiResponse>(`${prefix}/account/update`, payload);
    return res.data;
  },

  /** POST /account/update — upload avatar (multipart) */
  updateImage: async (role: Role, formData: FormData) => {
    const prefix = getPrefix(role);
    const res = await apiClient.post<ProfileApiResponse>(`${prefix}/account/update`, formData);
    return res.data;
  },

  /** POST /account/password/change — change password */
  updatePassword: async (role: Role, payload: UpdatePasswordPayload) => {
    const prefix = getPrefix(role);
    // Map frontend payload names to backend expected names
    const apiPayload = {
      old_password: payload.current_password,
      new_password: payload.password,
      new_password_confirmation: payload.password_confirmation
    };
    const res = await apiClient.post<ProfileApiResponse>(`${prefix}/account/password/change`, apiPayload);
    return res.data;
  },

  /** DELETE /account — delete account */
  deleteAccount: async (role: Role) => {
    const prefix = getPrefix(role);
    const res = await apiClient.delete<ProfileApiResponse>(`${prefix}/account/delete`, {
      data: { account_activation: true },
    });
    return res.data;
  },
};