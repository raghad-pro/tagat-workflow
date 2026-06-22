"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "@/modules/companies/api/companies.api";
import toast from "react-hot-toast";

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => companyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company removed successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while deleting the company", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};