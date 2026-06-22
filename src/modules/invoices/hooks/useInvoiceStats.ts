"use client";

import { useQuery } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";

export const useInvoiceStats = () =>
  useQuery({
    queryKey: ["invoices", "stats"],
    queryFn:  () => invoiceApi.getStats(),
  });