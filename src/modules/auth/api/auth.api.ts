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
    const response = await apiClient.post<ApiAuthResponse>("/api/v1/login", data);
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post<ApiAuthResponse>("/api/v1/register", data);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post<MessageResponse>("/api/v1/logout");
    return response.data;
  },

  // الـ /profile بدل /me
  // profile: async () => {
  //   const response = await apiClient.get<ApiAuthResponse>("/api/v1/profile");
  //   return response.data;
  // },

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/api/v1/forgot-password", data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpRequest) => {
    const response = await apiClient.post<{ success: boolean; data: VerifyOtpResponse }>("/api/v1/verify-otp", data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post<MessageResponse>("/api/v1/reset-password", data);
    return response.data;
  },
};