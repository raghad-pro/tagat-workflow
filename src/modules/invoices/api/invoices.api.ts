import apiClient from "@/services/apiClient";
import type {
  Invoice,
  InvoiceStats,
  InvoicesResponse,
  InvoicesQueryParams,
  CreateInvoiceRequest,
} from "../types/invoices.types";

export const invoiceApi = {
  // ─── جلب كل الفواتير (بحث + فلتر + pagination) ───────────────────────────
  getAll: (params?: InvoicesQueryParams) =>
    apiClient.get<InvoicesResponse>("/invoices", params as Record<string, unknown>),

  // ─── جلب الإحصائيات (الكروت الأربعة فوق) ─────────────────────────────────
  getStats: () =>
    apiClient.get<InvoiceStats>("/invoices/stats"),

  // ─── إنشاء فاتورة جديدة ───────────────────────────────────────────────────
  create: (data: CreateInvoiceRequest) =>
    apiClient.post<Invoice>("/invoices", data),

  // ─── حذف فاتورة ───────────────────────────────────────────────────────────
  delete: (id: string) =>
    apiClient.delete<void>(`/invoices/${id}`),

  // ─── تحديث فاتورة ─────────────────────────────────────────────────────────
  update: (id: string, data: Partial<CreateInvoiceRequest>) =>
    apiClient.put<Invoice>(`/invoices/${id}`, data),
};