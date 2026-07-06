import { useMutation } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";
import type { ChangePasswordRequest } from "../types/profile.types";
import toast from "react-hot-toast";

export const useChangePassword = () => {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: ChangePasswordRequest) => {
      if (!user?.role) throw new Error("Role is missing");
      return profileApi.changePassword(user.role, data);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Password changed successfully");
    },
    onError: (error: any) => {
      const backendMsg = error?.response?.data?.message || error?.message;
      toast.error(backendMsg || "Failed to change password");
      // Handle validation errors if any (e.g. error?.response?.data?.errors)
    },
  });
};
