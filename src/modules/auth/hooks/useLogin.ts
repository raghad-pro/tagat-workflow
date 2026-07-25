"use client";

import { tokenService } from "@/services/tokenServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import type { LoginRequest } from "../types/auth.types";
import { normalizeUser } from "../types/auth.types";
import toast from "react-hot-toast";

export const useLogin = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await authApi.login(data);
      if (res && (res as any).success === false) {
        throw new Error((res as any).message || "Login failed");
      }
      return res;
    },
    onSuccess: (response: any) => {
      console.log("Login Response Payload:", response);
      
      const payload = response?.data ? response.data : response;

      const token = payload?.token || payload?.access_token || payload?.data?.token || payload?.data?.access_token || response?.token || response?.access_token;
      
      const rawUser = payload?.user || payload?.company || payload?.admin || payload?.client || payload?.employee || payload?.company_request || payload?.data?.user || payload?.data?.company || response?.user || response?.company;

      if (!token && !rawUser) {
        toast.error("Unexpected API structure: " + Object.keys(payload || {}).join(", "));
        return;
      }

      const normalized = normalizeUser(rawUser, payload);

      if (token) {
        tokenService.setToken(token);
      }

      if (normalized) {
        setUser(normalized);
        toast.success(t("loginSuccess"));
        router.replace("/dashboard");
      } else {
        toast.error(t("loginError") || "Login failed: Invalid user data received");
        console.error("Invalid user object extracted:", rawUser, payload);
      }
    },
    
    onError: (error: any, variables: LoginRequest) => {
      const backendMsg = error?.response?.data?.message || error?.message || "";
      const lowerMsg = backendMsg.toLowerCase();
      
      // Check if message indicates unverified account
      if (lowerMsg.includes("verify") || lowerMsg.includes("verified") || lowerMsg.includes("activate") || lowerMsg.includes("active")) {
        toast.error(backendMsg || t("loginError"));
        router.replace("/verify?email=" + encodeURIComponent(variables.email));
      } else {
        toast.error(backendMsg || t("loginError"));
        console.log("Login Error details:", error?.response?.data || error);
      }
    },

  });
};
