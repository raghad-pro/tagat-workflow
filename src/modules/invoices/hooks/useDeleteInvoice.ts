"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";
import toast from "react-hot-toast";
import { useAuth } from "@/providers/AuthProvider";

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (id: string | number) => invoiceApi.delete(role, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice deleted successfully");
    },
    onError: () => {
      toast.error("Something went wrong while deleting the invoice");
    },
  });
};