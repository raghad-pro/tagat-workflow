import axios, { AxiosInstance } from "axios";
import { tokenService } from "./tokenServices";
import { ENV } from "@/config/env";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENV.API_URL,
  timeout: ENV.API_TIMEOUT ?? 15000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

axiosInstance.interceptors.request.use((config) => {
  const token = tokenService.getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // هاد الـ interceptor client-side فقط
      if (typeof window !== "undefined") {
        tokenService.removeToken();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;