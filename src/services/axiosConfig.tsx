import axios, { AxiosInstance, AxiosError } from "axios";
import { tokenService } from "./tokenServices";
import { ENV } from "@/config/env";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT ?? 15000,
  headers: {
    Accept: "application/json",
  },
});

// ─── Request interceptor — attach token ────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — handle errors ─────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }

    // نستخرج message واضحة من الـ response
    let serverMessage =
      (error.response?.data as any)?.message ?? error.message ?? "Request failed";

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      serverMessage = "انتهى وقت الاتصال (Timeout). يرجى التأكد من سرعة الإنترنت أو تقليل حجم الصورة.";
    }

    // نرجع error موحد
    return Promise.reject(
      Object.assign(error, { message: serverMessage })
    );
  }
);

export default axiosInstance;