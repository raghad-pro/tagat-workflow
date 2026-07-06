"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { VerifyOtpRequest } from "../types/auth.types";

export const useVerifyEmailOtp = () => {
  return useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      const res = await authApi.verifyEmailOtp(data);
      // Depending on the backend response, it might return status 200, status 1, or success true.
      // If the API returns a 200 OK from Axios, it's generally a success.
      // We will only throw if there's an explicit failure flag like status === 0 or success === false.
      if (res && (res.status === 0 || res.success === false)) {
        throw new Error(res.message || "Verification failed");
      }
      return res;
    }
  });
};
