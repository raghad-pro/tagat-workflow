import { useQuery } from "@tanstack/react-query";
import { profileApi } from "../api/profile.api";
import { useAuth } from "@/providers/AuthProvider";

export const useGetProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.role],
    queryFn: () => {
      if (!user?.role) throw new Error("Role is missing");
      return profileApi.getProfile(user.role);
    },
    enabled: !!user?.role,
  });
};
