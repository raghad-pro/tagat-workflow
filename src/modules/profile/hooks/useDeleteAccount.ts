import { useMutation } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export const useDeleteAccount = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (!user?.role) throw new Error("Role is missing");
      return profileApi.deleteAccount(user.role);
    },
    onSuccess: (res) => {
      toast.success(res.message || "Account deleted successfully");
      logout(); // clear state and tokens
      router.replace("/login");
    },
    onError: (error: any) => {
      const backendMsg = error?.response?.data?.message || error?.message;
      toast.error(backendMsg || "Failed to delete account");
    },
  });
};
