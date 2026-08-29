"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface ApproveParams {
  role: string;
  clientId: number;
  companyId: number;
}

export const useApproveJoinRequest = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("companyRequest.toast");

  return useMutation({
    mutationFn: ({ role, clientId, companyId }: ApproveParams) =>
      joinRequestApi.approve(role, clientId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      toast.success(t("approved"), {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error(t("approveFailed"), {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};