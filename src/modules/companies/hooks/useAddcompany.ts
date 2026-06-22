"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { companyApi } from "@/modules/companies/api/companies.api";
import type { AddCompanyRequest } from "@/modules/companies/types/companies.types";
import toast from "react-hot-toast";

export const useAddCompany = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddCompanyRequest) => companyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company added successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while adding the company", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};