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
    onError: () => {
      toast.error("Something went wrong while adding the client", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};