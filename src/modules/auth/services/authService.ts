import { authApi } from "../api/authApi";
import { tokenService } from "@/services/tokenServices";
import { ENV } from "@/config/env";

import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ApiAuthResponse,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
  MessageResponse
} from "../types/auth.types";

const IS_MOCK = ENV.IS_MOCK;
const getMock = () => import("@/lib/mockData");

const USER_KEY = "auth_user";

// ─── Helper: normalize الـ API response → AuthResponse ───────────────────────
function normalize(apiRes: ApiAuthResponse): AuthResponse {
  const { user, role, token } = apiRes.data;
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      role_id: user.role_id,
      company_id: user.company_id,
      is_active: user.is_active,
      image: user.image,
    },
  };
}

// ─── Helper: حفظ/جلب/مسح بيانات المستخدم مؤقتاً ─────────────────────────────
// ملاحظة: مؤقت لحين توفر endpoint الـ /profile من الـ backend
// لا يُحفظ فيه أي بيانات حساسة (password etc.)
function saveUser(user: AuthResponse["user"]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

function loadUser(): AuthResponse["user"] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearUser() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(USER_KEY);
  }
}

export const authService = {
  // ─── Login ───────────────────────────────────────────────────────────────────
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    if (IS_MOCK) {
      const { MOCK_USERS } = await getMock();
      const mockUser = MOCK_USERS[data.email];
      if (!mockUser || mockUser.password !== data.password) {
        throw new Error("invalid_credentials");
      }
      tokenService.setToken(mockUser.token);
      const { password, ...authResponse } = mockUser;
      saveUser(authResponse.user);
      return authResponse;
    }

    const res = await authApi.login(data);
    const normalized = normalize(res);
    tokenService.setToken(normalized.token);
    saveUser(normalized.user);
    return normalized;
  },

  // ─── Register ────────────────────────────────────────────────────────────────
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    if (IS_MOCK) {
      const mockResponse: AuthResponse = {
        token: "fake-token-new",
        user: {
          id: 99,
          name: data.name,
          email: data.email,
          role: data.account_type === "company" ? "company_admin" : "client",
          role_id: data.account_type === "company" ? 2 : 4,
          company_id: 1,
          is_active: 1,
          image: null,
        },
      };
      tokenService.setToken(mockResponse.token);
      saveUser(mockResponse.user);
      return mockResponse;
    }

    const res = await authApi.register(data);
    const normalized = normalize(res);
    tokenService.setToken(normalized.token);
    saveUser(normalized.user);
    return normalized;
  },

  // ─── Logout ──────────────────────────────────────────────────────────────────
  logout: async (): Promise<void> => {
    if (!IS_MOCK) {
      try {
        await authApi.logout();
      } catch {
        
      }
    }
    tokenService.removeToken();
    clearUser();
  },

  // ─── Me (مؤقت: من localStorage لحين توفر /profile) ──────────────────────────
  me: async (): Promise<AuthResponse["user"]> => {
    if (IS_MOCK) {
      const { MOCK_USERS } = await getMock();
      const token = tokenService.getToken();
      const mockEntry = Object.values(MOCK_USERS).find((u) => u.token === token);
      if (!mockEntry) throw new Error("unauthorized");
      const { password, ...rest } = mockEntry;
      return rest.user;
    }

    // TODO: استبدل بـ authApi.profile() لما يجهز الـ endpoint
    const user = loadUser();
    if (!user) throw new Error("unauthorized");
    return user;
  },

  // ─── Forgot Password — Step 1 ────────────────────────────────────────────────
  forgotPassword: async (data: ForgotPasswordRequest): Promise<MessageResponse> => {
    if (IS_MOCK) {
      const { MOCK_USERS, mockGenerateOtp } = await getMock();
      if (!MOCK_USERS[data.email]) throw new Error("email_not_found");
      const otp = mockGenerateOtp(data.email);
      console.info(`[MOCK] OTP for ${data.email}: ${otp}`);
      return { message: "otp_sent" };
    }

    return await authApi.forgotPassword(data);
  },

  // ─── Forgot Password — Step 2 ────────────────────────────────────────────────
  verifyOtp: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    if (IS_MOCK) {
      const { mockVerifyOtp } = await getMock();
      if (!mockVerifyOtp(data.email, data.otp)) throw new Error("invalid_otp");
      return { valid: true, reset_token: `reset-token-${data.email}` };
    }

    const res = await authApi.verifyOtp(data);
    return res.data;
  },

  // ─── Forgot Password — Step 3 ────────────────────────────────────────────────
  resetPassword: async (data: ResetPasswordRequest): Promise<MessageResponse> => {
    if (IS_MOCK) {
      const { mockClearOtp } = await getMock();
      if (data.reset_token !== `reset-token-${data.email}`) throw new Error("invalid_otp");
      mockClearOtp(data.email);
      return { message: "password_reset_success" };
    }

    return await authApi.resetPassword(data);
  },
};