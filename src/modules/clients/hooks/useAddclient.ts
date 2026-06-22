"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "../api/clients.api";
import type { AddClientRequest } from "../types/clients.types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

export const useAddClient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role ?? "super_admin";

  return useMutation({
    mutationFn: (data: AddClientRequest) => clientApi.create(data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client added successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: (error: any) => {
      let msg = "Something went wrong while adding the client";
      if (error?.response?.data?.message) {
        msg = error.response.data.message;
      }
      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        if (Array.isArray(firstError) && firstError[0]) {
          msg = firstError[0];
        }
      }
      toast.error(msg, {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};