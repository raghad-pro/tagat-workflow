"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileApi, UpdateProfilePayload, UpdatePasswordPayload } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";
import type { Role } from "@/modules/auth/types/auth.types";
import toast from "react-hot-toast";

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

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileApi.updateProfile(role, payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // update local auth user name if changed
      if (user && res?.name) {
        setUser({ ...user, name: res.name });
      }
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    },
  });
};

export const useUpdatePassword = () => {
  const { user } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;

  return useMutation({
    mutationFn: (payload: UpdatePasswordPayload) =>
      profileApi.updatePassword(role, payload),
    onSuccess: () => {
      toast.success("Password changed successfully");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to change password");
    },
  });
};

export const useDeleteAccount = () => {
  const { user, logout } = useAuth();
  const role = (user?.role ?? "super_admin") as Role;

  return useMutation({
    mutationFn: () => profileApi.deleteAccount(role),
    onSuccess: () => {
      toast.success("Account deleted");
      logout();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete account");
    },
  });
};