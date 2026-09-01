import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { tokenService } from "./tokenServices";
import { ENV } from "@/config/env";
import {
  UNREACHABLE_STATUSES,
  getApiBaseUrl,
  reportReachable,
  reportUnreachable,
} from "./apiFailover";

/** Set once a request has already been retried on the other host. */
type RetriableConfig = InternalAxiosRequestConfig & { _failoverRetried?: boolean };

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT ?? 15000,
  headers: {
    Accept: "application/json",
  },
});

/**
 * The host never answered, so the request can safely be sent again — as opposed
 * to a real response from the backend (404, 422, a Laravel 500), which means the
 * host is up and must not be retried.
 */
function isHostUnreachable(error: AxiosError): boolean {
  if (axios.isCancel(error) || error.code === "ERR_CANCELED") return false;
  if (!error.response) return true; // DNS failure, refused connection, timeout
  return UNREACHABLE_STATUSES.includes(error.response.status);
}

// ─── Request interceptor — attach token, pick the live host ───────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    config.baseURL = getApiBaseUrl();

    const token = tokenService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor — fail over to the second host ──────────────────────
axiosInstance.interceptors.response.use(
  (response) => {
    reportReachable(response.config.baseURL);
    return response;
  },
  (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (config && !config._failoverRetried && isHostUnreachable(error)) {
      const nextBaseUrl = reportUnreachable(config.baseURL ?? getApiBaseUrl());
      if (nextBaseUrl) {
        config._failoverRetried = true;
        config.baseURL = nextBaseUrl;
        return axiosInstance(config);
      }
    }

    return Promise.reject(error);
  }
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

    // اعتراض أخطاء Laravel الداخلية وتحويلها لرسائل مفهومة
    if (serverMessage.includes('Attempt to read property') && serverMessage.includes('on null')) {
      serverMessage = "خطأ في بيانات الحساب على السيرفر. يرجى التواصل مع مدير النظام لمراجعة إعدادات حسابك.";
    } else if (error.response?.status === 500) {
      serverMessage = "حدث خطأ داخلي في السيرفر. يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.";
    }

    // نرجع error موحد
    return Promise.reject(
      Object.assign(error, { message: serverMessage })
    );
  }
);

export default axiosInstance;
