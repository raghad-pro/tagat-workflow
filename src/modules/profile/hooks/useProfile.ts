"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, UpdateProfilePayload, UpdatePasswordPayload } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";
import type { Role } from "@/modules/auth/types/auth.types";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export const useProfile = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;

  return useQuery({
    queryKey: ["profile", role],
    queryFn: () => profileApi.getProfile(role),
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const { user, setUser } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;
  const queryClient = useQueryClient();
  const t = useTranslations("profile");

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileApi.updateProfile(role, payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // update local auth user name if changed
      if (user && res?.name) {
        setUser({ ...user, name: res.name });
      }
      toast.success(t("messages.updateSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t("messages.updateError"));
    },
  });
};

export const useUpdatePassword = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;
  const t = useTranslations("profile");

  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      profileApi.updatePassword(role, payload),
    onSuccess: () => {
      toast.success(t("messages.passwordSuccess"));
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t("messages.passwordError"));
    },
  });
};

export const useDeleteAccount = () => {
  const { user, logout } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;
  const t = useTranslations("profile");

  return useMutation({
    mutationFn: () => profileApi.deleteAccount(role),
    onSuccess: () => {
      toast.success(t("messages.deleteSuccess"));
      logout();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t("messages.deleteError"));
    },
  });
};