"use client";

import { useMutation } from "@tanstack/react-query";
import { authService } from "../services/authService";
import type { ForgotPasswordRequest } from "../types/auth.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useForgotPassword = () => {
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: (data: ForgotPasswordRequest) =>
      authService.forgotPassword(data),
onError: (error: Error) => {
  if (error.message === "email_not_found") {
    toast.error(t("email_not_found"), { id: "forgot-password-error" });
  } else {
    toast.error(t("generic_error"), { id: "forgot-password-error" });
  }
},
  });
};