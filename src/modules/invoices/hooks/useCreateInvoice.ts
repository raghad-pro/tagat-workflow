"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";
import type { CreateInvoiceRequest } from "../types/invoices.types";
import { useAuth } from "@/providers/AuthProvider";
import toast from "react-hot-toast";

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useMutation({
    mutationFn: (data: CreateInvoiceRequest) => invoiceApi.create(role, data),
    onSuccess: () => {
      // يعيد تحميل القائمة + الإحصائيات دفعة واحدة
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created successfully");
    },
    onError: () => {
      toast.error("Something went wrong while creating the invoice");
    },
  });
};