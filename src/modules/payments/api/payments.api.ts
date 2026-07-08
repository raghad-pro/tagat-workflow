import apiClient from "@/services/apiClient";
import type {
  Payment,
  PaymentStats,
  PaymentsQueryParams,
  AddPaymentRequest,
  ApiPaymentsResponse,
  ApiPaymentResponse,
  UpdatePaymentRequest,
  ApiPaymentDataResponse,
} from "../types/payments.types";

export const paymentsApi = {
  // ─── GET /super_admin/payments ───────────────────────────────────────────
  getAll: (params?: PaymentsQueryParams) =>
    apiClient.get<ApiPaymentsResponse>("/super_admin/payments", params as Record<string, unknown>),



  // ─── GET /super_admin/payments-data/:companyId ──────────────────────────
  getPaymentData: (companyId: number) =>
    apiClient.get<ApiPaymentDataResponse>(`/super_admin/payments-data/${companyId}`),

  // ─── POST /super_admin/payments ──────────────────────────────────────────
  create: (data: AddPaymentRequest) =>
    apiClient.post<ApiPaymentResponse>("/super_admin/payments", data),

  // ─── PUT /super_admin/payments/:id ───────────────────────────────────────
  update: (id: number, data: UpdatePaymentRequest) =>
    apiClient.put<ApiPaymentResponse>(`/super_admin/payments/${id}`, data),

  // ─── DELETE /super_admin/payments/:id ────────────────────────────────────
  delete: (id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`/super_admin/payments/${id}`),
};
