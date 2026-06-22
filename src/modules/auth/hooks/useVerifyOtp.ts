
"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { VerifyOtpRequest } from "../types/auth.types";

// لأن الـ OtpStep في الـ page بتتولى الـ onError بنفسها:
//   → بتحمّر المربعات وبتكتب نص الخطأ تحتها مباشرة
//   → هاد أفضل UX من الـ toast لأن المستخدم بيشوف الخطأ جنب الـ input
// الـ toast بيتستخدم بس في حالة "إعادة الإرسال" (في handleResend)

export const useVerifyOtp = () => {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtp(data),
    // لا onError هنا — الـ page بتتولى الـ error handling
  });
};