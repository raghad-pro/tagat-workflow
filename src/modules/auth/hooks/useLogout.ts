"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authApi } from "../api/auth.api";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export const useLogout = () => {
  const { logout } = useAuth();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      logout();
      toast.success(t("logoutSuccess"));
    },
    onError: () => {
      logout();
    },
  });
};