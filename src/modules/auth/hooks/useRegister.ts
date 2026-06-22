"use client";

import { tokenService } from "@/services/tokenServices";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import type { RegisterRequest } from "../types/auth.types";
import toast from "react-hot-toast";


export const useRegister = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await authApi.register(data);
      if (res && res.success === false) {
        throw new Error(res.message || "Registration failed");
      }
      return res;
    },
    onSuccess: (response: any) => {
      console.log("Register Response Payload:", response);
      
      const payload = response.data ? response.data : response;

      if (!payload || (!payload.user && !payload.token)) {
        toast.error("Unexpected response from server");
        return;
      }

      const user = { ...payload.user, role: payload.role || payload.user?.role };
      tokenService.setToken(payload.token);
      setUser(user as any);
      toast.success(t("registerSuccess"));
      router.replace("/dashboard");
    },
    onError: (error: any) => {
      const backendMsg = error?.response?.data?.message || error?.message;
      toast.error(backendMsg || t("registerError"));
      console.error("Register Error details:", error?.response?.data || error);
    },
  });
};
