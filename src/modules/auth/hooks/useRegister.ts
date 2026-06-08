"use client";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import type { RegisterRequest } from "../types/auth.types";
import toast from "react-hot-toast";

export const useRegister = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (response) => {
      setUser(response.user);
      toast.success(t("registerSuccess"));
      router.replace("/dashboard");
    },
    onError: () => {
      toast.error(t("registerError"));
    },
  });
};