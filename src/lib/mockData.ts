import type { AuthResponse } from "@/modules/auth/types/auth.types";

// ─── Mock Users ─────────────────────────────────────────────────────────────────

export const MOCK_USERS: Record<string, AuthResponse & { password: string }> = {
  "super@test.com": {
    password: "Super@123",
    token: "fake-token-super",
    user: {
      id: 1,
      name: "Super Admin",
      email: "super@test.com",
      role: "super_admin",
      company_id: null,
    },
  },
  "admin@test.com": {
    password: "Admin@123",
    token: "fake-token-admin",
    user: {
      id: 2,
      name: "Company Admin",
      email: "admin@test.com",
      role: "company_admin",
      company_id: 1,
    },
  },
  "employee@test.com": {
    password: "Employee@123",
    token: "fake-token-employee",
    user: {
      id: 3,
      name: "Employee",
      email: "employee@test.com",
      role: "employee",
      company_id: 1,
    },
  },
  "client@test.com": {
    password: "Client@123",
    token: "fake-token-client",
    user: {
      id: 4,
      name: "Client",
      email: "client@test.com",
      role: "client",
      company_id: null,
    },
  },
};

// ─── Mock OTP ───────────────────────────────────────────────────────────────────
// OTP ثابت لكل إيميل موجود في النظام — سهل للتيست
// الـ OTP الصح دايماً: 123456

export const MOCK_OTP_CODE = "1234";

// store مؤقت في الميموري — يحاكي إرسال OTP للإيميل
// في الواقع الباك إند هو اللي بيحفظ ويرسل
export const MOCK_OTP_STORE: Record<string, string> = {};

export function mockGenerateOtp(email: string): string {
  MOCK_OTP_STORE[email] = MOCK_OTP_CODE;
  return MOCK_OTP_CODE;
}

export function mockVerifyOtp(email: string, otp: string): boolean {
  return MOCK_OTP_STORE[email] === otp;
}

export function mockClearOtp(email: string): void {
  delete MOCK_OTP_STORE[email];
}