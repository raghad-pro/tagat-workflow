"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useTranslations } from "next-intl";
import type { RegisterRequest } from "../types/auth.types";
import toast from "react-hot-toast";

export const useRegister = () => {
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const res = await authApi.register(data);
      if (res && res.success === false) {
        throw new Error(res.message || "Registration failed");
      }
      return res;
    },
    onSuccess: (response: any, variables: RegisterRequest) => {
      console.log("Register Response Payload:", response);
      toast.success(t("registerSuccess") || "Registered successfully! Please verify your email.");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const backendMsg = data?.message || error?.message;
      
      if (!data?.errors) {
        toast.error(backendMsg || t("registerError"));
      } else {
        console.warn("Validation errors:", data.errors);
      }
    },
  });
};
