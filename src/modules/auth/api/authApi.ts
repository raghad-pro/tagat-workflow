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
  login: (data: LoginRequest) =>
    apiClient.post<ApiAuthResponse>("/login", data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiAuthResponse>("/register", data),

  logout: () =>
    apiClient.post<MessageResponse>("/logout"),

  // الـ /profile بدل /me
  // profile: () =>
  //   apiClient.get<ApiAuthResponse>("/profile"),

  // ─── Forgot Password ─────────────────────────────────────────────────────────
  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<MessageResponse>("/forgot-password", data),

  verifyOtp: (data: VerifyOtpRequest) =>
    apiClient.post<{ success: boolean; data: VerifyOtpResponse }>("/verify-otp", data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<MessageResponse>("/reset-password", data),
};