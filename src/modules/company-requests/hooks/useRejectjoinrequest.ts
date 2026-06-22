"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";
import toast from "react-hot-toast";

interface RejectParams {
  role: string;
  clientId: number;
  companyId: number;
}

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, clientId, companyId }: RejectParams) =>
      joinRequestApi.reject(role, clientId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      toast.success("Request rejected", {
        style: { background: "#dc2626", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while rejecting the request", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};