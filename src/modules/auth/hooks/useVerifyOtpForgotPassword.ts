"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import type { VerifyOtpRequest } from "../types/auth.types";

export const useVerifyOtpForgotPassword = () => {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => authApi.verifyOtpForgotPassword(data),
  });
};
