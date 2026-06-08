"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "../services/authService";
import { useAuth } from "@/providers/AuthProvider";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";

export const useLogout = () => {
  const { setUser } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      setUser(null);
      toast.success(t("logoutSuccess"));
      router.replace("/login");
    },
    onError: () => {
      // حتى لو الباك إند رجع error بنمسح التوكن ونروح للوقين
      setUser(null);
      router.replace("/login");
    },
  });
};