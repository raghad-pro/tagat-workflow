"use client";

import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";
import { useAuth } from "@/providers/AuthProvider";

export const useInvoiceStats = () => {
  const { user } = useAuth();
  const role = user?.role || "super_admin";

  return useQuery({
    queryKey: ["invoice-stats", role],
    queryFn: () => invoiceApi.getStats(role),
  });
};