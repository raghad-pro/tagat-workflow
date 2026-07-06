import apiClient from "@/services/apiClient";
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
    const response = await apiClient.post<ApiAuthResponse>("/login", data);
    return response.data;
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

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/reset-password", data);
    return (response as any).data || response;
  },
};
