"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";
import toast from "react-hot-toast";

interface ApproveParams {
  role: string;
  clientId: number;
  companyId: number;
}

export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ role, clientId, companyId }: ApproveParams) =>
      joinRequestApi.approve(role, clientId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      toast.success("Request approved successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while approving the request", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};