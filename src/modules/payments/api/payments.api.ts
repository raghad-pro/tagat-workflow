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

import { getRolePrefix } from "@/utils/rolePrefix";

export const paymentsApi = {
  getAll: (role: string, params?: PaymentsQueryParams) =>
    apiClient.get<ApiPaymentsResponse>(`${getRolePrefix(role)}/payments`, params as Record<string, unknown>),

  getPaymentData: (role: string, companyId?: number) => {
    const url = companyId 
      ? `${getRolePrefix(role)}/payments-data/${companyId}`
      : `${getRolePrefix(role)}/payments-data`;
    return apiClient.get<ApiPaymentDataResponse>(url);
  },

  getSingle: (role: string, id: number) =>
    apiClient.get<ApiPaymentResponse>(`${getRolePrefix(role)}/payments/${id}`),

  create: (role: string, data: AddPaymentRequest) =>
    apiClient.post<ApiPaymentResponse>(`${getRolePrefix(role)}/payments`, data),

  update: (role: string, id: number, data: UpdatePaymentRequest) =>
    apiClient.put<ApiPaymentResponse>(`${getRolePrefix(role)}/payments/${id}`, data),

  delete: (role: string, id: number) =>
    apiClient.delete<{ success: boolean; message: string }>(`${getRolePrefix(role)}/payments/${id}`),
};
