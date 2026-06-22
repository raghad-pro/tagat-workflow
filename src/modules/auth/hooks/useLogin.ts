"use client";

import { tokenService } from "@/services/tokenServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import type { LoginRequest } from "../types/auth.types";
import toast from "react-hot-toast";

export const useLogin = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await authApi.login(data);
      if (res && res.success === false) {
        throw new Error(res.message || "Login failed");
      }
      return res;
    },
    onSuccess: (response: any) => {
      console.log("Login Response Payload:", response);
      
      const payload = response?.data ? response.data : response;

      const token = payload?.token || payload?.access_token;
      const user = payload?.user || payload?.admin || payload?.client || payload?.employee;

      if (!token && !user) {
        toast.error("Unexpected API structure: " + Object.keys(payload || {}).join(", "));
        return;
      }

      const mergedUser = { ...user, role: payload?.role || user?.role };
      tokenService.setToken(token);
      setUser(mergedUser as any);
      toast.success(t("loginSuccess"));
      router.replace("/dashboard");
    },
    onError: (error: any) => {
      const backendMsg = error?.response?.data?.message || error?.message;
      toast.error(backendMsg || t("loginError"));
      console.error("Login Error details:", error?.response?.data || error);
    },
  });
};
