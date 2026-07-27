import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";
import type { UpdateProfileRequest } from "../types/profile.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useUpdateProfile = () => {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const t = useTranslations("profile");

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      if (!user?.role) throw new Error("Role is missing");
      return profileApi.updateProfile(user.role, data);
    },
    onSuccess: (res: any) => {
      toast.success(res.message || t("messages.updateSuccess"));
      queryClient.invalidateQueries({ queryKey: ["profile", user?.role] });
      
      // Update local user state
      if (user && res.data) {
        setUser({ ...user, ...res.data });
      }
    },
    onError: (error: any) => {
      const backendMsg = error?.response?.data?.message || error?.message;
      toast.error(backendMsg || t("messages.updateError"));
    },
  });
};
