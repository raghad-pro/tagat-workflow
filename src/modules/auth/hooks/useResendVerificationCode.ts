"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";

export const useResendVerificationCode = () => {
  return useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await authApi.resendVerificationCode(data);
      if (res && res.status !== 1) {
        throw new Error(res.message || "Failed to resend code");
      }
      return res;
    }
  });
};
