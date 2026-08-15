import apiClient from "@/services/apiClient";
import axiosInstance from "@/services/axiosConfig";
import { ENV } from "@/config/env";
import { getRolePrefix } from "@/utils/rolePrefix";
import Cookies from "js-cookie";
import type {
  ApiAuthResponse,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  VerifyOtpRequest,
  VerifyOtpResponse,
  ResetPasswordRequest,
  MessageResponse,
} from "../types/auth.types";

export const authApi = {
  // ─── Auth ────────────────────────────────────────────────────────────────────
  login: async (data: LoginRequest) => {
    // جلب CSRF Cookie من مسار Sanctum قبل تسجيل الدخول
    const baseUrlWithoutApi = ENV.API_URL.replace(/\/api\/?$/, '');

    const fetchCsrf = async () => {
      await axiosInstance.get('/sanctum/csrf-cookie', {
        baseURL: baseUrlWithoutApi,
        withCredentials: true,
        headers: { Accept: 'application/json' },
      });
    };

    try {
      await fetchCsrf();
    } catch (e) {
      console.warn("Could not fetch CSRF cookie", e);
    }

    const headers: Record<string, string> = { Accept: 'application/json' };
    const xsrfToken = Cookies.get('XSRF-TOKEN');
    if (xsrfToken) headers['X-XSRF-TOKEN'] = xsrfToken;

    const doLogin = () =>
      axiosInstance.post<ApiAuthResponse>("/login", data, {
        withCredentials: true,
        headers,
      });

    try {
      const response = await doLogin();
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      const msg: string = error?.response?.data?.message ?? error?.message ?? '';
      const isCsrfError = status === 419 || msg.toLowerCase().includes('csrf');

      if (!isCsrfError) throw error;

      // إعادة المحاولة مرة واحدة عند خطأ CSRF: تجديد التوكن ثم إعادة الإرسال
      console.warn('CSRF mismatch detected, refreshing token and retrying...');
      try {
        await fetchCsrf();
      } catch (e) {
        console.warn("Could not re-fetch CSRF cookie", e);
      }
      const retryToken = Cookies.get('XSRF-TOKEN');
      const retryHeaders: Record<string, string> = { Accept: 'application/json' };
      if (retryToken) retryHeaders['X-XSRF-TOKEN'] = retryToken;
      const retry = await axiosInstance.post<ApiAuthResponse>("/login", data, {
        withCredentials: true,
        headers: retryHeaders,
      });
      return retry.data;
    }
  },

  /**
   * The signed-in user as the server sees them *right now*, including
   * `roles[]` with each role's `permissions[]` embedded.
   *
   * The login response carries roles but no permissions, and is a snapshot
   * taken when the session began — so an account granted a new role mid-session
   * would keep its old access until it logged out. This is the endpoint that
   * lets a reload pick the change up.
   */
  me: async (role: string) => {
    const response = await apiClient.get<{ data: any }>(
      `${getRolePrefix(role)}/account`
    );
    return (response as any)?.data ?? null;
  },

  register: async (data: RegisterRequest) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("password_confirmation", data.password_confirmation);
    formData.append("account_type", data.account_type);

    if (data.company_name) formData.append("company_name", data.company_name);
    if (data.domain) formData.append("domain", data.domain);
    if (data.logo) formData.append("logo", data.logo);

    const response = await apiClient.post<ApiAuthResponse>("/register", formData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<MessageResponse>("/logout");
    return (response as any).data || response;
  },

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/forgot-password", data);
    return (response as any).data || response;
  },


  resendVerificationCode: async (data: { email: string }) => {
    const response = await apiClient.post<{ status: number; message: string }>('/resend-verification-code', data);
    return (response as any).data || response;
  },

  verifyEmailOtp: async (data: VerifyOtpRequest) => {
    const response = await apiClient.post<{ status: number | boolean; message: string; success?: boolean }>('/verify-email-otp', data);
    return response;
  },

  verifyOtp: async (data: VerifyOtpRequest) => {
    const response = await apiClient.post<{ success: boolean; data: VerifyOtpResponse }>("/verify-otp", data);
    return response.data;
  },

  verifyOtpForgotPassword: async (data: VerifyOtpRequest) => {
    const response = await apiClient.post<{ status: number | boolean; message: string; success?: boolean }>("/verify-otp-forgot-password", data);
    return response;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/reset-password", data);
    return (response as any).data || response;
  },
};
