"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { ResetPasswordRequest } from "../types/auth.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

// ملاحظة: شلنا router.replace("/login") وtوast.success من الـ onSuccess
// لأن الـ page بتتولى الـ success state بنفسها (step 4 - success screen)
// الـ onSuccess في useMutation بيتغلب عليه الـ onSuccess اللي بتمرريه من الـ mutate call

export const useResetPassword = () => {
  const t = useTranslations("auth");

  return useMutation({
    mutationFn: (data: ResetPasswordRequest) => authApi.resetPassword(data),

    // ← onSuccess الـ global فاضي — الـ page callback بتتولى
    onSuccess: () => {
      // لا toast هنا، لا router redirect
      // الـ page بتنقل لـ step 4 (SuccessStep) عن طريق الـ onSuccess callback
    },

    // ③ بنستخدم id ثابت عشان لما المستخدم يضغط أكثر من مرة
    //   نفس الـ toast بيتحدث (مع animation خفيفة) بدل ما يتراكم
    onError: (error: Error) => {
      if (error.message === "invalid_otp") {
        toast.error(t("otp_invalid"), { id: "reset-password-error" });
      } else {
        toast.error(t("generic_error"), { id: "reset-password-error" });
      }
    },
  });
};