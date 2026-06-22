"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "../api/clients.api";
import type { UpdateClientStatusRequest } from "../types/clients.types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

type UpdateArgs = {
  id: number;
  data: UpdateClientStatusRequest;
};

export const useUpdateClientStatus = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role ?? "super_admin";

  return useMutation({
    mutationFn: ({ id, data }: UpdateArgs) =>
      clientApi.updateStatus(id, data, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client status updated successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while updating the status", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};