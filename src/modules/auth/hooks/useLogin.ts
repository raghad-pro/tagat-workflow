"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import type { LoginRequest } from "../types/auth.types";
import toast from "react-hot-toast";

export const useLogin = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: (response) => {
      setUser(response.user);
      toast.success(t("loginSuccess"));
      router.replace("/dashboard");
    },
    onError: () => {
      toast.error(t("loginError"));
    },
  });
};