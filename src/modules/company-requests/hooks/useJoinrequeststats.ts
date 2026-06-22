"use client";

import { useQuery } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";

export const useJoinRequestStats = (role = "super_admin") => {
  return useQuery({
    queryKey: ["join-requests", "stats", role],
    queryFn: () => joinRequestApi.getStats(role),
  });
};