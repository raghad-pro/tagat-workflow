import type { GenericStatus } from "@/types/Shared.types";

// ─── Enums / Unions ────────────────────────────────────────────────────────────
export type InvoiceStatus = "paid" | "unpaid" | "partially_paid" | "overdue" | "pending" | string;

export type InvoiceCurrency = "USD" | "EUR" | "GBP" | "SAR" | "AED" | string;

// ─── Entity ──────────────────────────────────────────────────────────────────
export interface Invoice {
  id: number | string;
  company_id: number | string;
  client_id: number | string;
  project_id: number | string;
  currency_id: number | string;
  invoice_date: string;
  due_date: string;
  amount: string | number;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  
  // Relations
  company?: { id: number | string; name: string; email?: string; [key: string]: any };
  client?: { id: number | string; name: string; [key: string]: any };
  project?: { id: number | string; title: string; budget?: string; [key: string]: any };
  currency?: { id: number | string; code: string; name: string; symbol: string; [key: string]: any };
  payments?: any[];
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  [key: string]: any;
}

// ─── Requests ────────────────────────────────────────────────────────────────
export interface CreateInvoiceRequest {
  company_id: string | number;
  client_id: string | number;
  project_id: string | number;
  currency_id: string | number;
  amount: string | number;
  invoice_date: string;
  due_date: string;
  status: string;
}

export interface InvoicesQueryParams {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
  company_id?: string | number;
}

// ─── Responses ───────────────────────────────────────────────────────────────
export interface InvoicesResponse {
  current_page: number;
  data: Invoice[];
  first_page_url: string | null;
  from: number | null;
  last_page: number;
  last_page_url: string | null;
  links: any[];
  next_page_url?: string | null;
  path?: string;
  per_page?: number;
  prev_page_url?: string | null;
  to?: number | null;
  total?: number;
}

// ─── Status Maps (shared constants — co-locate with types) ───────────────────
export const INVOICE_STATUS_TO_GENERIC: Record<
  string,
  Extract<GenericStatus, "success" | "pending" | "failed">
> = {
  paid:    "success",
  Paid:    "success",
  unpaid: "pending",
  Unpaid: "pending",
  pending: "pending",
  Pending: "pending",
  overdue: "failed",
  Overdue: "failed",
  partially_paid: "pending",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  paid:    "Paid",
  Paid:    "Paid",
  unpaid: "Unpaid",
  Unpaid: "Unpaid",
  pending: "Pending",
  Pending: "Pending",
  overdue: "Overdue",
  Overdue: "Overdue",
  partially_paid: "Partially Paid",
};