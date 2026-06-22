"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { invoiceApi } from "../api/invoices.api";
import type { InvoicesQueryParams } from "../types/invoices.types";

export const useInvoices = (params: InvoicesQueryParams) =>
  useQuery({
    queryKey: ["invoices", params],
    queryFn:  () => invoiceApi.getAll(params),
    // يحافظ على البيانات القديمة أثناء تحميل الصفحة/الفلتر الجديد
    placeholderData: keepPreviousData,
  });