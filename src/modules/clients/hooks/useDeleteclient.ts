"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "../api/clients.api";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

type DeleteClientArgs = {
  id: number;
  company_id: number;
};

export const useDeleteClient = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role ?? "super_admin";

  return useMutation({
    mutationFn: ({ id, company_id }: DeleteClientArgs) =>
      clientApi.delete(id, { company_id }, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Client removed successfully", {
        style: { background: "#1d9e75", color: "#fff" },
      });
    },
    onError: () => {
      toast.error("Something went wrong while removing the client", {
        style: { background: "#F92929", color: "#fff" },
      });
    },
  });
};