"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { joinRequestApi } from "../api/company-requests.api";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface RejectParams {
  role: string;
  clientId: number;
  companyId: number;
}

export const useRejectJoinRequest = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("companyRequest.toast");

  return useMutation({
    mutationFn: ({ role, clientId, companyId }: RejectParams) =>
      joinRequestApi.reject(role, clientId, companyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["join-requests"] });
      toast.success(t("rejected"), {
        style: { background: "#dc2626", color: "#fff" },
      });
    },
    onError: () => {
      toast.error(t("rejectFailed"), {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};