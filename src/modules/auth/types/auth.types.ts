export type Role = "super_admin" | "company_admin" | "employee" | "client";

// role_id → Role mapping (من الـ API بييجي رقم)
export const ROLE_MAP: Record<number, Role> = {
  1: "super_admin",
  2: "company_admin",
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
};

export type ForgotPasswordRequest = {
  email: string;
};

export type VerifyOtpRequest = {
  email: string;
  otp: string;
};

export type ResetPasswordRequest = {
  email: string;
  reset_token: string;
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