import type { GenericStatus } from "@/types/Shared.types";

// ─── Enums / Unions ───────────────────────────────────────────────────────────
export type InvoiceStatus = "Paid" | "Pending" | "Overdue";

export type InvoiceCurrency = "USD" | "EUR" | "GBP" | "SAR" | "AED";

// ─── Entity ───────────────────────────────────────────────────────────────────
export interface Invoice {
  id: string;
  invoiceNumber: string;
  company: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: InvoiceCurrency;
  status: InvoiceStatus;
  client: string;
  project: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
}

// ─── Requests ─────────────────────────────────────────────────────────────────
export interface CreateInvoiceRequest {
  company: string;
  client: string;
  project: string;
  currency: InvoiceCurrency | "";
  amount: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus | "";
}

export interface InvoicesQueryParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

// ─── Responses ────────────────────────────────────────────────────────────────
export interface InvoicesMeta {
  total: number;
  page: number;
  per_page: number;
}

export interface InvoicesResponse {
  data: Invoice[];
  meta: InvoicesMeta;
}

// ─── Status Maps (shared constants — co-locate with types) ───────────────────
export const INVOICE_STATUS_TO_GENERIC: Record<
  InvoiceStatus,
  Extract<GenericStatus, "success" | "pending" | "failed">
> = {
  Paid:    "success",
  Pending: "pending",
  Overdue: "failed",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  Paid:    "Paid",
  Pending: "Pending",
  Overdue: "Overdue",
};